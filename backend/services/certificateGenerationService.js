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
            // ... map others if needed
        };

        if (officialsRows) {
            officialsRows.forEach(o => {
                if (o.position_type === 'captain') officials.chairman = o.name;
                else if (o.position_type === 'secretary') officials.secretary = o.name;
                else if (o.position_type === 'treasurer') officials.treasurer = o.name;
            });
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
        // Handle base64 or path for logos. Ideally, convert paths to absolute or base64 if needed for PDF rendering tools.
        // Since this saves as HTML, relative paths might fail if opened elsewhere. 
        // Assuming 'logos.leftLogo' is a URL/Path. User uploads dataURL in frontend, so it's likely base64 data:image/...

        const leftLogoSrc = logos.leftLogo || '';
        const rightLogoSrc = logos.rightLogo || '';
        const size = logos.logoSize || 80;

        return `
        <div class="header" style="border-bottom: 3px solid ${styles.headerStyle.borderColor}; background-color: ${styles.headerStyle.bgColor};">
            <div class="logo-section">
                <div class="logo" style="width: ${size}px; height: ${size}px;">
                    ${leftLogoSrc ? `<img src="${leftLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
                </div>
                <div class="header-text">
                    <div class="country" style="color: ${styles.countryStyle.color}; font-size: ${styles.countryStyle.size}px; font-weight: ${styles.countryStyle.fontWeight}">${headerInfo.country}</div>
                    <div class="province" style="color: ${styles.provinceStyle.color}; font-size: ${styles.provinceStyle.size}px; font-weight: ${styles.provinceStyle.fontWeight}">${headerInfo.province}</div>
                    <div class="municipality" style="color: ${styles.municipalityStyle.color}; font-size: ${styles.municipalityStyle.size}px; font-weight: ${styles.municipalityStyle.fontWeight}">${headerInfo.municipality}</div>
                    <div class="barangay-name" style="color: ${styles.barangayNameStyle.color}; font-size: ${styles.barangayNameStyle.size}px; font-weight: ${styles.barangayNameStyle.fontWeight}">${headerInfo.barangayName}</div>
                    <div class="office-name" style="color: ${styles.officeNameStyle.color}; font-size: ${styles.officeNameStyle.size}px; font-weight: ${styles.officeNameStyle.fontWeight}">${headerInfo.officeName}</div>
                </div>
                <div class="logo" style="width: ${size}px; height: ${size}px;">
                     ${rightLogoSrc ? `<img src="${rightLogoSrc}" style="width: 100%; height: 100%; object-fit: contain;">` : ''}
                </div>
            </div>
        </div>
      `;
    }

    generateFooter(request, config) {
        const { styles, contactInfo } = config;
        return `
        <div class="footer" style="color: ${styles.footerStyle.textColor}; border-top: 1px solid ${styles.footerStyle.borderColor}; background-color: ${styles.footerStyle.bgColor};">
            <div>${contactInfo?.address || ''}</div>
            <div>Reference No: <strong>${request.reference_number}</strong> | Generated on: ${new Date().toLocaleString()}</div>
            <div>This is a computer-generated certificate. Verify authenticity by scanning the QR code.</div>
        </div>
      `;
    }

    generateBarangayClearanceContent(request, config) {
        const { officials, styles } = config;
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Default title color if not set in bodyStyle (fallback)
        const titleColor = styles.bodyStyle.titleColor || '#16a34a';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Clearance - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: ${styles.bodyStyle.fontFamily !== 'default' ? styles.bodyStyle.fontFamily : 'Arial, sans-serif'}; margin: 0; padding: 20px; line-height: 1.4; color: ${styles.bodyStyle.textColor}; background-color: ${styles.bodyStyle.bgColor}; }
        .header { text-align: center; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-text { flex: 1; text-align: center; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: ${titleColor}; margin: 30px 0; text-decoration: underline; }
        .content { margin: 30px 0; }
        .greeting { font-weight: bold; margin-bottom: 20px; }
        .body-text { text-align: justify; margin-bottom: 20px; }
        .details { margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 8px; }
        .detail-label { width: 150px; font-weight: bold; }
        .detail-value { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 50px; }
        .signature-label { font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    ${this.generateHeader(config)}

    <div class="title" style="color: ${titleColor}">BARANGAY CLEARANCE CERTIFICATE</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that the below mentioned person is a bona fide resident of this barangay 
            and has no derogatory record as of the date mentioned below:
        </div>

        <div class="details">
            <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${request.full_name}</div></div>
            <div class="detail-row"><div class="detail-label">Age:</div><div class="detail-value">${request.age}</div></div>
            <div class="detail-row"><div class="detail-label">Sex:</div><div class="detail-value">${request.sex}</div></div>
            <div class="detail-row"><div class="detail-label">Civil Status:</div><div class="detail-value">${request.civil_status}</div></div>
            <div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">${request.address}</div></div>
            <div class="detail-row"><div class="detail-label">Purpose:</div><div class="detail-value">${request.purpose}</div></div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the above-mentioned person for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at ${config.headerInfo.barangayName}, ${config.headerInfo.municipality}, ${config.headerInfo.province}.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.secretary}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.chairman}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    ${this.generateFooter(request, config)}
</body>
</html>`;
    }

    generateIndigencyContent(request, config) {
        const { officials, styles, headerInfo } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const titleColor = styles.bodyStyle.titleColor || '#16a34a';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Indigency - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: ${styles.bodyStyle.fontFamily !== 'default' ? styles.bodyStyle.fontFamily : 'Arial, sans-serif'}; margin: 0; padding: 20px; line-height: 1.4; color: ${styles.bodyStyle.textColor}; background-color: ${styles.bodyStyle.bgColor}; }
        .header { text-align: center; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-text { flex: 1; text-align: center; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: ${titleColor}; margin: 30px 0; text-decoration: underline; }
        .content { margin: 30px 0; }
        .greeting { font-weight: bold; margin-bottom: 20px; }
        .body-text { text-align: justify; margin-bottom: 20px; }
        .details { margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 8px; }
        .detail-label { width: 150px; font-weight: bold; }
        .detail-value { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 50px; }
        .signature-label { font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    ${this.generateHeader(config)}

    <div class="title" style="color: ${titleColor}">CERTIFICATE OF INDIGENCY</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that <strong>${request.full_name}</strong>, of legal age, 
            ${request.sex}, ${request.civil_status}, and a resident of ${request.address}, 
            belongs to an indigent family in this barangay.
        </div>

        <div class="details">
            <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${request.full_name}</div></div>
            <div class="detail-row"><div class="detail-label">Age:</div><div class="detail-value">${request.age}</div></div>
            <div class="detail-row"><div class="detail-label">Sex:</div><div class="detail-value">${request.sex}</div></div>
            <div class="detail-row"><div class="detail-label">Civil Status:</div><div class="detail-value">${request.civil_status}</div></div>
            <div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">${request.address}</div></div>
            <div class="detail-row"><div class="detail-label">Purpose:</div><div class="detail-value">${request.purpose}</div></div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the interested party for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at ${headerInfo.barangayName}, ${headerInfo.municipality}, ${headerInfo.province}.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.secretary}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.chairman}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    ${this.generateFooter(request, config)}
</body>
</html>`;
    }

    generateResidencyContent(request, config) {
        const { officials, styles, headerInfo } = config;
        const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const titleColor = styles.bodyStyle.titleColor || '#16a34a';

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Residency Certificate - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: ${styles.bodyStyle.fontFamily !== 'default' ? styles.bodyStyle.fontFamily : 'Arial, sans-serif'}; margin: 0; padding: 20px; line-height: 1.4; color: ${styles.bodyStyle.textColor}; background-color: ${styles.bodyStyle.bgColor}; }
        .header { text-align: center; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-text { flex: 1; text-align: center; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: ${titleColor}; margin: 30px 0; text-decoration: underline; }
        .content { margin: 30px 0; }
        .greeting { font-weight: bold; margin-bottom: 20px; }
        .body-text { text-align: justify; margin-bottom: 20px; }
        .details { margin: 20px 0; }
        .detail-row { display: flex; margin-bottom: 8px; }
        .detail-label { width: 150px; font-weight: bold; }
        .detail-value { flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { text-align: center; width: 200px; }
        .signature-line { border-bottom: 1px solid #000; margin-bottom: 5px; height: 50px; }
        .signature-label { font-size: 12px; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    ${this.generateHeader(config)}

    <div class="title" style="color: ${titleColor}">CERTIFICATE OF RESIDENCY</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that <strong>${request.full_name}</strong>, of legal age, 
            ${request.sex}, ${request.civil_status}, is a bonafide resident of 
            ${request.address}, ${headerInfo.barangayName}, ${headerInfo.municipality}, ${headerInfo.province}.
        </div>

        <div class="details">
            <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${request.full_name}</div></div>
            <div class="detail-row"><div class="detail-label">Age:</div><div class="detail-value">${request.age}</div></div>
            <div class="detail-row"><div class="detail-label">Sex:</div><div class="detail-value">${request.sex}</div></div>
            <div class="detail-row"><div class="detail-label">Civil Status:</div><div class="detail-value">${request.civil_status}</div></div>
            <div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">${request.address}</div></div>
            <div class="detail-row"><div class="detail-label">Purpose:</div><div class="detail-value">${request.purpose}</div></div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the above-mentioned person for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at ${headerInfo.barangayName}, ${headerInfo.municipality}, ${headerInfo.province}.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.secretary}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials.chairman}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    ${this.generateFooter(request, config)}
</body>
</html>`;
    }

    generateQRCodeSVG(text) {
        // Simple QR code placeholder - in production, use a proper QR code library
        const encoded = Buffer.from(`VERIFY:${text}`).toString('base64');
        return encoded;
    }
}

module.exports = new CertificateGenerationService();