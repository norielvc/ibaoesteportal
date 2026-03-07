const fs = require('fs');
const path = require('path');
const { supabase } = require('./supabaseClient');

class CertificateGenerationService {
    constructor() {
        this.certificatesDir = path.join(__dirname, '../generated-certificates');
        this.ensureCertificatesDirectory();
    }

    ensureCertificatesDirectory() {
        if (!fs.existsSync(this.certificatesDir)) {
            fs.mkdirSync(this.certificatesDir, { recursive: true });
        }
    }

    // Helper to fetch and map configuration
    async getBarangayConfig() {
        // 1. Fetch Officials
        const { data: officialsRows } = await supabase
            .from('barangay_officials')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        // 2. Fetch Settings
        const { data: settingsRow } = await supabase
            .from('barangay_settings')
            .select('value')
            .eq('key', 'certificate_settings')
            .single();

        const settings = settingsRow?.value || {}; // Contains headerInfo, logos, styles etc.

        // Map officials to simple keys
        const officials = {
            chairman: 'ALEXANDER C. MANIO', // Fallback
            secretary: 'ROYCE ANN C. GALVEZ',
            treasurer: 'MA. LUZ S. REYES',
            skChairman: 'JOHN RUZZEL C. SANTOS',
            councilors: [],
            administrator: 'ROBERT D. SANTOS',
            assistantSecretary: 'PERLITA C. DE JESUS',
            assistantAdministrator: 'KHINZ JANZL V. BARROGA',
            recordKeeper: 'EMIL D. ROBLES',
            clerk: 'CIELITO B. DE LEON',
        };

        if (officialsRows) {
            const kagawads = [];
            officialsRows.forEach(o => {
                const pos = o.position_type?.toLowerCase();
                const name = o.name;

                if (pos === 'captain' || pos === 'chairman' || pos === 'punong_barangay') officials.chairman = name;
                else if (pos === 'secretary') officials.secretary = name;
                else if (pos === 'treasurer') officials.treasurer = name;
                else if (pos === 'sk_chairman') officials.skChairman = name;
                else if (pos === 'kagawad' || pos === 'councilor') kagawads.push(name);
                else if (pos === 'administrator') officials.administrator = name;
                else if (pos === 'assistant_secretary') officials.assistantSecretary = name;
                else if (pos === 'assistant_administrator') officials.assistantAdministrator = name;
                else if (pos === 'record_keeper') officials.recordKeeper = name;
                else if (pos === 'clerk') officials.clerk = name;
            });
            if (kagawads.length > 0) officials.councilors = kagawads;
            else officials.councilors = ['JOELITO C. MANIO', 'ENGELBERT M. INDUCTIVO', 'NORMANDO T. SANTOS', 'JOPHET M. TURLA', 'JOHN BRYAN C. CRUZ', 'ARNEL D. BERNARDINO', 'LORENA G. LOPEZ'];
        }

        return {
            officials,
            ...settings, // headerInfo, logos, styles (headerStyle, countryStyle, etc)
            // Ensure defaults if settings are empty
            headerInfo: settings.headerInfo || {
                country: 'Republic of the Philippines',
                province: 'Province of Bulacan',
                municipality: 'Municipality of Calumpit',
                barangayName: "BARANGAY IBA O' ESTE",
                officeName: 'Office of the Punong Barangay'
            },
            styles: {
                headerStyle: settings.headerStyle || { borderColor: '#1e40af', bgColor: '#ffffff' },
                countryStyle: settings.countryStyle || { color: '#666', size: 14 },
                provinceStyle: settings.provinceStyle || { color: '#666', size: 14 },
                municipalityStyle: settings.municipalityStyle || { color: '#666', size: 14 },
                barangayNameStyle: settings.barangayNameStyle || { color: '#1e40af', size: 24, fontWeight: 'bold' },
                officeNameStyle: settings.officeNameStyle || { color: '#888', size: 12 },
                bodyStyle: settings.bodyStyle || { textColor: '#000000', titleColor: '#16a34a' },
                footerStyle: settings.footerStyle || { textColor: '#666666', borderColor: '#ddd' }
            },
            logos: settings.logos || { logoSize: 80 }
        };
    }

    async generateCertificate(requestId) {
        try {
            console.log(`Generating certificate for request ID: ${requestId}`);

            // Get certificate request details
            const { data: request, error: requestError } = await supabase
                .from('certificate_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (requestError) throw requestError;
            if (!request) throw new Error('Certificate request not found');

            // Get dynamic configuration
            const config = await this.getBarangayConfig();

            // Generate certificate content based on type
            let certificateContent;
            switch (request.certificate_type) {
                case 'barangay_clearance':
                    certificateContent = await this.generateBarangayClearanceContent(request, config);
                    break;
                case 'certificate_of_indigency':
                    certificateContent = this.generateIndigencyContent(request, config);
                    break;
                case 'barangay_residency':
                    certificateContent = this.generateResidencyContent(request, config);
                    break;
                case 'business_permit':
                    // Use the new Business Clearance template
                    certificateContent = await this.generateBusinessClearanceContent(request, config);
                    break;
                default:
                    throw new Error(`Unknown certificate type: ${request.certificate_type}`);
            }

            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${request.reference_number}_${timestamp}.html`;
            const filePath = path.join(this.certificatesDir, filename);

            // Save certificate to file
            fs.writeFileSync(filePath, certificateContent);

            // Update database with certificate info
            const { error: updateError } = await supabase
                .from('certificate_requests')
                .update({
                    certificate_file_path: filePath,
                    certificate_generated_at: new Date().toISOString(),
                    status: 'ready'
                })
                .eq('id', requestId);

            if (updateError) throw updateError;

            console.log(`Certificate generated successfully: ${filename}`);
            return {
                success: true,
                filePath,
                filename,
                referenceNumber: request.reference_number
            };

        } catch (error) {
            console.error('Error generating certificate:', error);
            throw error;
        }
    }

    // Common Header Generator
    generateHeader(config) {
        const { headerInfo, logos, styles } = config;
        const leftLogoSrc = logos.leftLogo || '';
        const rightLogoSrc = logos.rightLogo || '';
        const size = logos.logoSize || 80;

        const getFontClass = (font) => {
            const fonts = { 'serif': 'font-family: serif;', 'sans': 'font-family: sans-serif;', 'mono': 'font-family: monospace;' };
            return fonts[font] || '';
        };

        return `
        <div class="header" style="display: flex; align-items: center; justify-content: center; padding: 20px 40px; border-bottom: 2px solid ${styles.headerStyle.borderColor || '#1e40af'}; background-color: ${styles.headerStyle.bgColor || '#ffffff'}; ${getFontClass(styles.headerStyle.fontFamily)}">
            <div style="width: ${size}px; height: ${size}px; flex-shrink: 0;">
                ${leftLogoSrc ? `<img src="${leftLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
            </div>
            <div style="text-align: center; flex: 1; padding: 0 20px;">
                <p style="margin: 0; color: ${styles.countryStyle.color || '#4b5563'}; font-size: ${styles.countryStyle.size || 13}px; font-weight: ${styles.countryStyle.fontWeight || 'normal'}; line-height: 1.2; ${getFontClass(styles.countryStyle.fontFamily)}">${headerInfo.country || 'Republic of the Philippines'}</p>
                <p style="margin: 0; color: ${styles.provinceStyle.color || '#4b5563'}; font-size: ${styles.provinceStyle.size || 13}px; font-weight: ${styles.provinceStyle.fontWeight || 'normal'}; line-height: 1.2; ${getFontClass(styles.provinceStyle.fontFamily)}">${headerInfo.province || 'Province of Bulacan'}</p>
                <p style="margin: 0; color: ${styles.municipalityStyle.color || '#4b5563'}; font-size: ${styles.municipalityStyle.size || 13}px; font-weight: ${styles.municipalityStyle.fontWeight || 'normal'}; line-height: 1.2; ${getFontClass(styles.municipalityStyle.fontFamily)}">${headerInfo.municipality || 'Municipality of Calumpit'}</p>
                <p style="margin: 4px 0 0; color: ${styles.barangayNameStyle.color || '#1e40af'}; font-size: ${styles.barangayNameStyle.size || 22}px; font-weight: ${styles.barangayNameStyle.fontWeight || 'bold'}; line-height: 1.2; ${getFontClass(styles.barangayNameStyle.fontFamily)}">${headerInfo.barangayName || "BARANGAY IBA O' ESTE"}</p>
                <p style="margin: 0; color: ${styles.officeNameStyle.color || '#6b7280'}; font-size: ${styles.officeNameStyle.size || 12}px; font-weight: ${styles.officeNameStyle.fontWeight || 'normal'}; line-height: 1.2; ${getFontClass(styles.officeNameStyle.fontFamily)}">${headerInfo.officeName || 'Office of the Punong Barangay'}</p>
            </div>
            <div style="width: ${size}px; height: ${size}px; flex-shrink: 0;">
                ${rightLogoSrc ? `<img src="${rightLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
            </div>
        </div>
      `;
    }

    generateSidebar(config) {
        const { officials, styles, logos } = config;
        const s = styles.sidebarStyle || {};

        const getFontClass = (font) => {
            const fonts = { 'serif': 'font-family: serif;', 'sans': 'font-family: sans-serif;', 'mono': 'font-family: monospace;' };
            return fonts[font] || '';
        };

        return `
        <div class="sidebar" style="width: 220px; flex-shrink: 0; padding: 20px; color: ${s.textColor || '#ffffff'}; background: linear-gradient(to bottom, ${s.bgColor || '#1e40af'}, ${s.gradientEnd || '#1e3a8a'}); text-align: center; ${getFontClass(s.fontFamily)}">
            <div style="margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold; font-size: ${(s.titleSize || 16) + 4}px;">BARANGAY</p>
                <p style="margin: 0; font-weight: bold; font-size: ${(s.titleSize || 16) + 4}px;">IBA O' ESTE</p>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.2); pt-3;">
                <p style="font-weight: bold; margin: 15px 0 10px; color: ${s.labelColor || '#fde047'}; font-size: ${(s.titleSize || 13) + 2}px;">BARANGAY COUNCIL</p>
                
                <div style="margin-bottom: 15px;">
                    <div style="width: 120px; height: 160px; margin: 0 auto 10px; background-color: rgba(0,0,0,0.1); border-radius: 8px; border: 2px solid rgba(255,255,255,0.2); overflow: hidden;">
                        ${logos.captainImage ? `<img src="${logos.captainImage}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
                    </div>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Punong Barangay</p>
                    <p style="margin: 0; font-weight: bold; font-size: ${(s.textSize || 11) + 1}px;">${officials.chairman}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p style="margin: 0 0 5px; font-size: ${s.textSize || 11}px; opacity: 0.8;">Kagawad</p>
                    ${officials.councilors.map(c => `<p style="margin: 0; font-size: ${s.textSize || 11}px; line-height: 1.4;">${c}</p>`).join('')}
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">SK Chairman</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.skChairman}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 8px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Barangay Secretary</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.secretary}</p>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding: 8px 0;">
                    <p style="margin: 0; font-size: ${s.textSize || 11}px; opacity: 0.8;">Barangay Treasurer</p>
                    <p style="margin: 0; font-size: ${s.textSize || 11}px;">${officials.treasurer}</p>
                </div>
            </div>
        </div>
        `;
    }

    generateFooter(request, config) {
        const { styles, contactInfo } = config;
        return `
        <div class="footer" style="padding: 15px 40px; font-size: 10px; color: ${styles.footerStyle.textColor || '#374151'}; border-top: 2px solid ${styles.footerStyle.borderColor || '#d1d5db'}; background-color: ${styles.footerStyle.bgColor || '#f9fafb'};">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <p style="margin: 0;"><strong>Address:</strong> ${contactInfo?.address || ''}</p>
                    <p style="margin: 0;"><strong>Contact:</strong> ${contactInfo?.contactPerson || ''} (${contactInfo?.telephone || ''}) email: ${contactInfo?.email || ''}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0;">Reference No: <strong>${request.reference_number}</strong></p>
                    <p style="margin: 0;">Generated on: ${new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
      `;
    }

    async generateBarangayClearanceContent(request, config) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        // Check if this clearance has physical inspection data
        const inspectionData = await this.getPhysicalInspectionData(request.id);
        const hasInspectionData = inspectionData && Object.keys(inspectionData.areas).some(area => 
            inspectionData.areas[area].findings || inspectionData.areas[area].date || inspectionData.areas[area].remarks
        );

        let bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident of this barangay and has no derogatory record as of date mentioned below:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>`;

        // Add physical inspection section if data exists
        if (hasInspectionData) {
            bodyHtml += `
                <div style="margin: 30px 0; border: 1px solid #ccc; padding: 15px;">
                    <h3 style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Physical Inspection Report</h3>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Areas</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 40%;">Findings and Recommendations</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Date of Inspection</th>
                                <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateInspectionRows(inspectionData.areas)}
                        </tbody>
                    </table>
                    
                    <div style="margin-top: 15px; font-size: 11px;">
                        <strong>Date and Time of Visit:</strong> ${inspectionData.visitDateTime ? new Date(inspectionData.visitDateTime).toLocaleString() : 'N/A'}<br>
                        <strong>Name of Owner / Representative:</strong> ${inspectionData.ownerRepresentative || 'N/A'}
                    </div>

                    <div style="margin-top: 15px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold;">Recommending Approval</h4>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                            <thead>
                                <tr style="background: #f0f0f0;">
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 30%;">Committee</th>
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 50%;">Name of Signatory</th>
                                    <th style="border: 1px solid #000; padding: 4px; text-align: left; width: 20%;">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateCommitteeRows(inspectionData.recommendations)}
                            </tbody>
                        </table>
                    </div>
                </div>`;
        }

        bodyHtml += `
                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line">
                            <p style="font-size: 12px; margin: 0;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('BARANGAY CLEARANCE CERTIFICATE', bodyHtml, request, config);
    }

    generateIndigencyContent(request, config) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident and their family belongs to the "Indigent Families" of this barangay as of date mentioned below. Further certifying that their income is not enough to sustain and support their basic needs:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>

                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line">
                            <p style="font-size: 12px; margin: 0;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('CERTIFICATE OF INDIGENCY', bodyHtml, request, config);
    }

    generateResidencyContent(request, config) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        const bodyHtml = `
            <div style="font-size: ${bodyStyle.textSize || 14}px; line-height: 1.6;">
                <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                
                <p style="margin: 20px 0;">
                    This is to certify that below mentioned person is a bona fide resident of this barangay as of the date mentioned below:
                </p>

                <div class="details-grid">
                    <span class="detail-label">Name</span><span>:</span><span class="detail-value" style="font-size: 1.2em;">${request.full_name}</span>
                    <span class="detail-label">Age</span><span>:</span><span class="detail-value">${request.age || '-'}</span>
                    <span class="detail-label">Sex</span><span>:</span><span class="detail-value">${request.sex || '-'}</span>
                    <span class="detail-label">Civil Status</span><span>:</span><span class="detail-value">${request.civil_status || '-'}</span>
                    <span class="detail-label">Residential Address</span><span>:</span><span class="detail-value">${request.address || '-'}</span>
                    <span class="detail-label">Date of Birth</span><span>:</span><span class="detail-value">${request.date_of_birth ? new Date(request.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : '-'}</span>
                    <span class="detail-label">Place of Birth</span><span>:</span><span class="detail-value">${request.place_of_birth || '-'}</span>
                </div>

                <div style="margin: 30px 0;">
                    <p>This certification is being issued upon the request of above mentioned person for below purpose(s):</p>
                    <p style="padding-left: 20px; font-weight: bold; font-size: 1.1em; margin-top: 10px;">• ${request.purpose ? request.purpose.toUpperCase() : 'GENERAL PURPOSES'}</p>
                </div>

                <p style="margin-bottom: 40px;">
                    Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
                </p>

                <div class="signature-section">
                    <div class="sig-block">
                        <div class="sig-line">
                            <p style="font-size: 12px; margin: 0;">Resident's Signature / Thumb Mark</p>
                        </div>
                    </div>

                    <div class="sig-block" style="margin-top: 20px;">
                        <p style="font-weight: bold; margin: 0;">TRULY YOURS,</p>
                        <div style="height: 40px;"></div>
                        <p style="font-weight: bold; margin: 0; text-transform: uppercase; font-size: 1.1em;">${officials.chairman}</p>
                        <p style="font-size: 11px; font-weight: bold; margin: 0;">BARANGAY CHAIRMAN</p>
                    </div>
                </div>
            </div>
        `;

        return this.generateDocument('BARANGAY RESIDENCY CERTIFICATE', bodyHtml, request, config);
    }

    generateDocument(title, bodyHtml, request, config) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title} - ${request.reference_number}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 14px;
                    line-height: 1.6;
                }
                .certificate-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 20px 0; 
                    text-align: center;
                    text-transform: uppercase;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    gap: 8px 15px;
                    margin: 20px 0;
                    align-items: baseline;
                }
                .detail-label {
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .detail-value {
                    font-weight: bold;
                    text-decoration: underline;
                }
                .signature-section {
                    margin-top: 60px;
                }
                .sig-block {
                    margin: 20px 0;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    width: 300px;
                    height: 40px;
                    margin: 20px 0 5px 0;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .certificate-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                ${this.generateHeader(config)}
                
                <div class="title">${title}</div>
                
                ${bodyHtml}
                
                ${this.generateFooter(request, config)}
            </div>
        </body>
        </html>
        `;
    }

    async generateBusinessPermitContent(request, config) {
        // Get physical inspection data from the new tables
        const inspectionData = await this.getPhysicalInspectionData(request.id);
        
        const qrCodeSVG = this.generateQRCodeSVG(`${config.baseUrl}/verify/${request.reference_number}`);
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Business Permit - ${request.reference_number}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .certificate-container { 
                    max-width: 800px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 20px;
                }
                .logo { 
                    width: 80px; 
                    height: 80px; 
                    margin: 0 auto 10px; 
                }
                .title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    margin: 10px 0; 
                    text-transform: uppercase;
                }
                .subtitle { 
                    font-size: 16px; 
                    margin: 5px 0; 
                }
                .content { 
                    margin: 20px 0; 
                }
                .section { 
                    margin: 20px 0; 
                    border: 1px solid #000;
                    padding: 15px;
                }
                .section-title { 
                    font-size: 14px; 
                    font-weight: bold; 
                    margin-bottom: 10px; 
                    text-transform: uppercase;
                    background: #f0f0f0;
                    padding: 5px;
                    margin: -15px -15px 10px -15px;
                }
                .info-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0;
                }
                .info-table td { 
                    padding: 5px; 
                    border: 1px solid #000; 
                    vertical-align: top;
                }
                .info-table .label { 
                    font-weight: bold; 
                    background: #f9f9f9; 
                    width: 30%;
                }
                .inspection-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 10px 0;
                    font-size: 10px;
                }
                .inspection-table th, .inspection-table td { 
                    padding: 4px; 
                    border: 1px solid #000; 
                    text-align: left;
                }
                .inspection-table th { 
                    background: #f0f0f0; 
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .signatures { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-top: 40px; 
                }
                .signature-block { 
                    text-align: center; 
                    width: 45%; 
                }
                .signature-line { 
                    border-bottom: 1px solid #000; 
                    margin: 30px 0 5px 0; 
                    height: 1px; 
                }
                .qr-code { 
                    position: absolute; 
                    top: 20px; 
                    right: 20px; 
                    width: 80px; 
                    height: 80px; 
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .certificate-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <div class="qr-code">${qrCodeSVG}</div>
                
                ${this.generateHeader(config)}
                
                <div class="title">Business Permit</div>
                <div class="subtitle">Reference No: ${request.reference_number}</div>
                
                <div class="content">
                    <div class="section">
                        <div class="section-title">Business Information</div>
                        <table class="info-table">
                            <tr>
                                <td class="label">Full Name</td>
                                <td>${request.full_name || request.applicant_name || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="label">Complete Address</td>
                                <td>${request.address || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="label">Business Name</td>
                                <td>${this.getBusinessDetail(request, 'businessName') || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="label">Nature of Business</td>
                                <td>${this.getBusinessDetail(request, 'natureOfBusiness') || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="label">Business Complete Address</td>
                                <td>${this.getBusinessDetail(request, 'businessAddress') || request.address || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td class="label">Contact Person / Number</td>
                                <td>${this.getBusinessDetail(request, 'contactPerson') || request.contact_number || 'N/A'}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">A. Actions Taken by Inspection Committee</div>
                        <table class="inspection-table">
                            <thead>
                                <tr>
                                    <th style="width: 20%">Areas</th>
                                    <th style="width: 40%">Findings and Recommendations</th>
                                    <th style="width: 20%">Date of Inspection</th>
                                    <th style="width: 20%">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateInspectionRows(inspectionData.areas)}
                            </tbody>
                        </table>
                        
                        <div style="margin-top: 15px;">
                            <strong>Date and Time of Visit:</strong> ${inspectionData.visitDateTime ? new Date(inspectionData.visitDateTime).toLocaleString() : 'N/A'}<br>
                            <strong>Name of Owner / Representative:</strong> ${inspectionData.ownerRepresentative || 'N/A'}
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">B. Recommending Approval</div>
                        <table class="inspection-table">
                            <thead>
                                <tr>
                                    <th style="width: 30%">Committee</th>
                                    <th style="width: 50%">Name of Signatory</th>
                                    <th style="width: 20%">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateCommitteeRows(inspectionData.recommendations)}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${this.generateFooter(request, config)}
            </div>
        </body>
        </html>
        `;
    }

    getBusinessDetail(request, field) {
        try {
            const details = typeof request.details === 'string' ? JSON.parse(request.details || '{}') : (request.details || {});
            return details[field] || '';
        } catch (e) {
            return '';
        }
    }

    generateInspectionRows(areas) {
        if (!areas || typeof areas !== 'object') {
            return '<tr><td colspan="4" style="text-align: center; font-style: italic;">No inspection data available</td></tr>';
        }

        return Object.entries(areas).map(([areaName, areaData]) => `
            <tr>
                <td style="font-weight: bold;">${areaName}</td>
                <td>${areaData.findings || ''}</td>
                <td>${areaData.date || ''}</td>
                <td>${areaData.remarks || ''}</td>
            </tr>
        `).join('');
    }

    generateCommitteeRows(recommendations) {
        if (!recommendations || typeof recommendations !== 'object') {
            return '<tr><td colspan="3" style="text-align: center; font-style: italic;">No committee recommendations available</td></tr>';
        }

        return Object.entries(recommendations).map(([committeeName, committeeData]) => `
            <tr>
                <td style="font-weight: bold;">${committeeName}</td>
                <td>${committeeData.name || ''}</td>
                <td>${committeeData.date || ''}</td>
            </tr>
        `).join('');
    }

    async getPhysicalInspectionData(requestId) {
        try {
            // Get the main inspection report
            const { data: report, error: reportError } = await supabase
                .from('physical_inspection_reports')
                .select('*')
                .eq('request_id', requestId)
                .single();

            if (reportError && reportError.code !== 'PGRST116') {
                console.error('Error fetching inspection report:', reportError);
                return this.getDefaultInspectionData();
            }

            if (!report) {
                return this.getDefaultInspectionData();
            }

            // Get area findings
            const { data: areaFindings, error: areaError } = await supabase
                .from('inspection_area_findings')
                .select('*')
                .eq('inspection_report_id', report.id);

            if (areaError) {
                console.error('Error fetching area findings:', areaError);
                return this.getDefaultInspectionData();
            }

            // Get committee recommendations
            const { data: committeeRecs, error: committeeError } = await supabase
                .from('committee_recommendations')
                .select('*')
                .eq('inspection_report_id', report.id);

            if (committeeError) {
                console.error('Error fetching committee recommendations:', committeeError);
                return this.getDefaultInspectionData();
            }

            // Format the data
            const inspectionData = {
                areas: {},
                visitDateTime: report.visit_datetime,
                ownerRepresentative: report.owner_representative,
                recommendations: {}
            };

            // Format area findings
            areaFindings.forEach(area => {
                inspectionData.areas[area.area_name] = {
                    findings: area.findings || '',
                    date: area.inspection_date || '',
                    remarks: area.remarks || ''
                };
            });

            // Format committee recommendations
            committeeRecs.forEach(committee => {
                inspectionData.recommendations[committee.committee_name] = {
                    name: committee.signatory_name || '',
                    date: committee.recommendation_date || ''
                };
            });

            return inspectionData;

        } catch (error) {
            console.error('Error getting physical inspection data:', error);
            return this.getDefaultInspectionData();
        }
    }

    getDefaultInspectionData() {
        return {
            areas: {
                'HEALTH AND SAFETY': { findings: '', date: '', remarks: '' },
                'SANITATION': { findings: '', date: '', remarks: '' },
                'HEALTH HAZARD': { findings: '', date: '', remarks: '' },
                'BUILDING PERMIT': { findings: '', date: '', remarks: '' },
                'FIRE EXIT / HAZARD': { findings: '', date: '', remarks: '' },
                'ENVIRONMENT': { findings: '', date: '', remarks: '' },
                'WASTE MANAGEMENT': { findings: '', date: '', remarks: '' },
                'HAZARDOUS WASTE': { findings: '', date: '', remarks: '' },
                'OTHERS': { findings: '', date: '', remarks: '' },
                'COMPLAINTS, ETC.': { findings: '', date: '', remarks: '' }
            },
            visitDateTime: '',
            ownerRepresentative: '',
            recommendations: {
                'HEALTH': { name: '', date: '' },
                'ENVIRONMENT': { name: '', date: '' },
                'INFRASTRUCTURE': { name: '', date: '' },
                'PEACE & ORDER': { name: '', date: '' }
            }
        };
    }

    async generateBusinessClearanceContent(request, config) {
        // Get physical inspection data
        const inspectionData = await this.getPhysicalInspectionData(request.id);
        
        // Get OR details if available
        const { data: orData } = await supabase
            .from('official_receipts')
            .select('or_number, amount_paid, control_number')
            .eq('request_id', request.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        const businessDetails = request.business_details || {};
        const isRenewal = businessDetails.clearanceType === 'renewal';
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Barangay Business Clearance - ${request.reference_number}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: 'Arial', sans-serif; 
                    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
                    padding: 20px;
                    line-height: 1.6;
                }
                
                .certificate-container { 
                    max-width: 850px; 
                    margin: 0 auto; 
                    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #e0f2fe 100%);
                    border: 3px solid #0369a1;
                    border-radius: 15px;
                    padding: 40px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    position: relative;
                }
                
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 120px;
                    color: rgba(3, 105, 161, 0.05);
                    font-weight: bold;
                    z-index: 0;
                    pointer-events: none;
                }
                
                .content-wrapper {
                    position: relative;
                    z-index: 1;
                    background: rgba(255, 255, 255, 0.95);
                    padding: 30px;
                    border-radius: 10px;
                }
                
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px;
                    border-bottom: 3px solid #0369a1;
                }
                
                .title { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #0369a1;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin: 20px 0;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
                }
                
                .to-whom { 
                    font-size: 16px; 
                    margin: 20px 0;
                    font-weight: 600;
                    color: #333;
                }
                
                .intro-text {
                    font-size: 14px;
                    margin: 20px 0;
                    text-align: justify;
                    color: #444;
                }
                
                .checkbox-section {
                    display: flex;
                    gap: 40px;
                    justify-content: center;
                    margin: 25px 0;
                }
                
                .checkbox-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    font-weight: 600;
                }
                
                .checkbox {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #0369a1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    font-weight: bold;
                    color: #0369a1;
                }
                
                .info-grid {
                    margin: 25px 0;
                }
                
                .info-row {
                    display: flex;
                    margin: 12px 0;
                    font-size: 14px;
                }
                
                .info-label {
                    font-weight: bold;
                    min-width: 200px;
                    color: #333;
                }
                
                .info-value {
                    flex: 1;
                    color: #0369a1;
                    font-weight: 600;
                    border-bottom: 1px solid #0369a1;
                    padding-bottom: 2px;
                }
                
                .compliance-text {
                    font-size: 13px;
                    text-align: justify;
                    margin: 25px 0;
                    padding: 15px;
                    background: rgba(3, 105, 161, 0.05);
                    border-left: 4px solid #0369a1;
                    line-height: 1.8;
                    color: #444;
                }
                
                .issuance-text {
                    font-size: 13px;
                    margin: 20px 0;
                    color: #444;
                }
                
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .payment-details {
                    text-align: left;
                    flex: 1;
                }
                
                .payment-title {
                    font-weight: bold;
                    font-size: 14px;
                    text-decoration: underline;
                    margin-bottom: 10px;
                    color: #0369a1;
                }
                
                .payment-row {
                    font-size: 13px;
                    margin: 5px 0;
                    color: #444;
                }
                
                .signature-block {
                    text-align: center;
                    flex: 1;
                }
                
                .truly-yours {
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 50px;
                    color: #333;
                }
                
                .signature-name {
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    border-top: 2px solid #000;
                    padding-top: 5px;
                    color: #0369a1;
                }
                
                .signature-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #666;
                }
                
                @media print {
                    body { 
                        background: white; 
                        padding: 0; 
                    }
                    .certificate-container { 
                        border: 2px solid #0369a1; 
                        box-shadow: none;
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="certificate-container">
                <div class="watermark">BARANGAY</div>
                
                <div class="content-wrapper">
                    <div class="header">
                        ${this.generateHeader(config)}
                    </div>
                    
                    <div class="title">BARANGAY BUSINESS CLEARANCE</div>
                    
                    <div class="to-whom">To Whom It May Concern:</div>
                    
                    <div class="intro-text">
                        This is to certify that below business / trade name as described herein applying for:
                    </div>
                    
                    <div class="checkbox-section">
                        <div class="checkbox-item">
                            <span class="checkbox">${!isRenewal ? '✓' : ''}</span>
                            <span>New Business Clearance</span>
                        </div>
                        <div class="checkbox-item">
                            <span class="checkbox">${isRenewal ? '✓' : ''}</span>
                            <span>Renewal of Existing Business Clearance</span>
                        </div>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="info-label">Name of Owner</span>
                            <span class="info-value">${request.full_name || request.applicant_name || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Owner's Address</span>
                            <span class="info-value">${request.address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Business / Trade Name</span>
                            <span class="info-value">${businessDetails.businessName || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Business Address</span>
                            <span class="info-value">${businessDetails.businessAddress || request.address || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Nature of Business</span>
                            <span class="info-value">${businessDetails.natureOfBusiness || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="compliance-text">
                        The subject business establishment upon occular visit / inspection conducted by this office jointly with Sangguniang Barangay Committees on Health, Environment and Finance and Barangay Treasurer found to be compliant and in confirmity with the existing barangay ordinances, rules and regulations as applicable for this nature of business being applied for clearance.
                    </div>
                    
                    <div class="compliance-text">
                        In view of the above, this office poses no objection for the issuance of further permits as necessary for the conduct of above business activity including Mayor's Permit, etc.
                    </div>
                    
                    <div class="issuance-text">
                        Issued this at Barangay Iba O' Este, Calumpit, Bulacan.
                    </div>
                    
                    <div class="signature-section">
                        <div class="payment-details">
                            <div class="payment-title">Details of Payment</div>
                            <div class="payment-row">OR NO. : <strong>${orData?.or_number || '_____________'}</strong></div>
                            <div class="payment-row">Amount Paid : <strong>${orData?.amount_paid ? '₱' + parseFloat(orData.amount_paid).toFixed(2) : '_____________'}</strong></div>
                            <div class="payment-row">BC Control No.: <strong>${orData?.control_number || request.reference_number || '_____________'}</strong></div>
                        </div>
                        
                        <div class="signature-block">
                            <div class="truly-yours">TRULY YOURS,</div>
                            <div class="signature-name">${config.officials.chairman}</div>
                            <div class="signature-title">BARANGAY CHAIRMAN</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    generateQRCodeSVG(text) {
        // Simple QR code placeholder - in production, use a proper QR code library
        const encoded = Buffer.from(`VERIFY:${text}`).toString('base64');
        return encoded;
    }
}

module.exports = new CertificateGenerationService();