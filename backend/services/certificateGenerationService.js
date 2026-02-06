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
                    certificateContent = this.generateBarangayClearanceContent(request, config);
                    break;
                case 'certificate_of_indigency':
                    certificateContent = this.generateIndigencyContent(request, config);
                    break;
                case 'barangay_residency':
                    certificateContent = this.generateResidencyContent(request, config);
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

    generateBarangayClearanceContent(request, config) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const bodyStyle = styles.bodyStyle || {};

        const bodyHtml = `
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

    generateQRCodeSVG(text) {
        // Simple QR code placeholder - in production, use a proper QR code library
        const encoded = Buffer.from(`VERIFY:${text}`).toString('base64');
        return encoded;
    }
}

module.exports = new CertificateGenerationService();