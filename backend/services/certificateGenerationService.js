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

      // Get barangay officials data
      const { data: officials, error: officialsError } = await supabase
        .from('officials')
        .select('*')
        .eq('is_active', true)
        .single();

      if (officialsError) {
        console.warn('No officials data found, using defaults');
      }

      // Generate certificate content based on type
      let certificateContent;
      switch (request.certificate_type) {
        case 'barangay_clearance':
          certificateContent = this.generateBarangayClearanceContent(request, officials);
          break;
        case 'certificate_of_indigency':
          certificateContent = this.generateIndigencyContent(request, officials);
          break;
        case 'barangay_residency':
          certificateContent = this.generateResidencyContent(request, officials);
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
          status: 'ready_for_pickup'
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

  generateBarangayClearanceContent(request, officials) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Clearance - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .logo { width: 80px; height: 80px; }
        .header-text { flex: 1; text-align: center; }
        .country { font-size: 14px; color: #666; }
        .province { font-size: 14px; color: #666; }
        .municipality { font-size: 14px; color: #666; }
        .barangay-name { font-size: 24px; font-weight: bold; color: #1e40af; margin: 10px 0; }
        .office-name { font-size: 12px; color: #888; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: #16a34a; margin: 30px 0; text-decoration: underline; }
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
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    <div class="header">
        <div class="logo-section">
            <div class="logo"></div>
            <div class="header-text">
                <div class="country">Republic of the Philippines</div>
                <div class="province">Province of Bulacan</div>
                <div class="municipality">Municipality of Calumpit</div>
                <div class="barangay-name">BARANGAY IBA O' ESTE</div>
                <div class="office-name">Office of the Punong Barangay</div>
            </div>
            <div class="logo"></div>
        </div>
    </div>

    <div class="title">BARANGAY CLEARANCE CERTIFICATE</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that the below mentioned person is a bona fide resident of this barangay 
            and has no derogatory record as of the date mentioned below:
        </div>

        <div class="details">
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${request.full_name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Age:</div>
                <div class="detail-value">${request.age}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Sex:</div>
                <div class="detail-value">${request.sex}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Civil Status:</div>
                <div class="detail-value">${request.civil_status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Address:</div>
                <div class="detail-value">${request.address}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purpose:</div>
                <div class="detail-value">${request.purpose}</div>
            </div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the above-mentioned person for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at Barangay Iba O' Este, Calumpit, Bulacan.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.secretary || 'ROYCE ANN C. GALVEZ'}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.chairman || 'ALEXANDER C. MANIO'}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    <div class="footer">
        <div>Reference No: <strong>${request.reference_number}</strong></div>
        <div>Generated on: ${new Date().toLocaleString()}</div>
        <div>This is a computer-generated certificate. Verify authenticity by scanning the QR code.</div>
    </div>
</body>
</html>`;
  }

  generateIndigencyContent(request, officials) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate of Indigency - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .logo { width: 80px; height: 80px; }
        .header-text { flex: 1; text-align: center; }
        .country { font-size: 14px; color: #666; }
        .province { font-size: 14px; color: #666; }
        .municipality { font-size: 14px; color: #666; }
        .barangay-name { font-size: 24px; font-weight: bold; color: #1e40af; margin: 10px 0; }
        .office-name { font-size: 12px; color: #888; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: #16a34a; margin: 30px 0; text-decoration: underline; }
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
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    <div class="header">
        <div class="logo-section">
            <div class="logo"></div>
            <div class="header-text">
                <div class="country">Republic of the Philippines</div>
                <div class="province">Province of Bulacan</div>
                <div class="municipality">Municipality of Calumpit</div>
                <div class="barangay-name">BARANGAY IBA O' ESTE</div>
                <div class="office-name">Office of the Punong Barangay</div>
            </div>
            <div class="logo"></div>
        </div>
    </div>

    <div class="title">CERTIFICATE OF INDIGENCY</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that <strong>${request.full_name}</strong>, of legal age, 
            ${request.sex}, ${request.civil_status}, and a resident of ${request.address}, 
            belongs to an indigent family in this barangay.
        </div>

        <div class="details">
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${request.full_name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Age:</div>
                <div class="detail-value">${request.age}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Sex:</div>
                <div class="detail-value">${request.sex}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Civil Status:</div>
                <div class="detail-value">${request.civil_status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Address:</div>
                <div class="detail-value">${request.address}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purpose:</div>
                <div class="detail-value">${request.purpose}</div>
            </div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the interested party for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at Barangay Iba O' Este, Calumpit, Bulacan.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.secretary || 'ROYCE ANN C. GALVEZ'}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.chairman || 'ALEXANDER C. MANIO'}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    <div class="footer">
        <div>Reference No: <strong>${request.reference_number}</strong></div>
        <div>Generated on: ${new Date().toLocaleString()}</div>
        <div>This is a computer-generated certificate. Verify authenticity by scanning the QR code.</div>
    </div>
</body>
</html>`;
  }

  generateResidencyContent(request, officials) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Barangay Residency Certificate - ${request.reference_number}</title>
    <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .logo { width: 80px; height: 80px; }
        .header-text { flex: 1; text-align: center; }
        .country { font-size: 14px; color: #666; }
        .province { font-size: 14px; color: #666; }
        .municipality { font-size: 14px; color: #666; }
        .barangay-name { font-size: 24px; font-weight: bold; color: #1e40af; margin: 10px 0; }
        .office-name { font-size: 12px; color: #888; }
        .title { text-align: center; font-size: 28px; font-weight: bold; color: #16a34a; margin: 30px 0; text-decoration: underline; }
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
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        .qr-section { position: absolute; top: 20px; right: 20px; text-align: center; }
        .qr-code { width: 80px; height: 80px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="qr-section">
        <div class="qr-code" style="background: url('data:image/svg+xml;base64,${this.generateQRCodeSVG(request.reference_number)}') center/contain no-repeat;"></div>
        <div style="font-size: 8px; margin-top: 5px;">${request.reference_number}</div>
    </div>

    <div class="header">
        <div class="logo-section">
            <div class="logo"></div>
            <div class="header-text">
                <div class="country">Republic of the Philippines</div>
                <div class="province">Province of Bulacan</div>
                <div class="municipality">Municipality of Calumpit</div>
                <div class="barangay-name">BARANGAY IBA O' ESTE</div>
                <div class="office-name">Office of the Punong Barangay</div>
            </div>
            <div class="logo"></div>
        </div>
    </div>

    <div class="title">CERTIFICATE OF RESIDENCY</div>

    <div class="content">
        <div class="greeting">To Whom It May Concern:</div>
        
        <div class="body-text">
            This is to certify that <strong>${request.full_name}</strong>, of legal age, 
            ${request.sex}, ${request.civil_status}, is a bonafide resident of 
            ${request.address}, Barangay Iba O' Este, Calumpit, Bulacan.
        </div>

        <div class="details">
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${request.full_name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Age:</div>
                <div class="detail-value">${request.age}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Sex:</div>
                <div class="detail-value">${request.sex}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Civil Status:</div>
                <div class="detail-value">${request.civil_status}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Address:</div>
                <div class="detail-value">${request.address}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Purpose:</div>
                <div class="detail-value">${request.purpose}</div>
            </div>
        </div>

        <div class="body-text">
            This certification is issued upon the request of the above-mentioned person for 
            <strong>${request.purpose}</strong> and for whatever legal purpose it may serve.
        </div>

        <div class="body-text">
            Issued this <strong>${currentDate}</strong> at Barangay Iba O' Este, Calumpit, Bulacan.
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.secretary || 'ROYCE ANN C. GALVEZ'}</strong><br>
                Barangay Secretary
            </div>
        </div>
        <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">
                <strong>${officials?.chairman || 'ALEXANDER C. MANIO'}</strong><br>
                Punong Barangay
            </div>
        </div>
    </div>

    <div class="footer">
        <div>Reference No: <strong>${request.reference_number}</strong></div>
        <div>Generated on: ${new Date().toLocaleString()}</div>
        <div>This is a computer-generated certificate. Verify authenticity by scanning the QR code.</div>
    </div>
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