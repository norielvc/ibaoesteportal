const { supabase } = require('./supabaseClient');
const crypto = require('crypto');

class QRCodeService {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async generatePickupQRCode(requestId) {
    try {
      console.log(`Generating pickup QR code for request ID: ${requestId}`);

      // Get certificate request details
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Certificate request not found');

      // Generate secure pickup token
      const pickupToken = this.generatePickupToken(request);
      
      // Create pickup verification record
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

      const { data: pickupRecord, error: pickupError } = await supabase
        .from('certificate_pickups')
        .insert([{
          request_id: requestId,
          pickup_token: pickupToken,
          qr_code_data: this.generateQRData(request, pickupToken),
          expires_at: expiryDate.toISOString(),
          status: 'pending'
        }])
        .select()
        .single();

      if (pickupError) throw pickupError;

      // Generate QR code URL for verification
      const qrCodeUrl = `${this.baseUrl}/verify-pickup?token=${pickupToken}&ref=${request.reference_number}`;

      console.log(`Pickup QR code generated: ${pickupToken}`);
      
      return {
        success: true,
        pickupToken,
        qrCodeUrl,
        qrCodeData: pickupRecord.qr_code_data,
        expiresAt: expiryDate.toISOString(),
        referenceNumber: request.reference_number
      };

    } catch (error) {
      console.error('Error generating pickup QR code:', error);
      throw error;
    }
  }

  generatePickupToken(request) {
    // Generate secure token using request data and timestamp
    const data = `${request.id}-${request.reference_number}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  generateQRData(request, pickupToken) {
    return JSON.stringify({
      type: 'certificate_pickup',
      reference_number: request.reference_number,
      pickup_token: pickupToken,
      certificate_type: request.certificate_type,
      applicant_name: request.full_name,
      generated_at: new Date().toISOString(),
      verify_url: `${this.baseUrl}/verify-pickup?token=${pickupToken}&ref=${request.reference_number}`
    });
  }

  async verifyPickupToken(token, referenceNumber) {
    try {
      console.log(`Verifying pickup token: ${token} for reference: ${referenceNumber}`);

      // Get pickup record
      const { data: pickup, error: pickupError } = await supabase
        .from('certificate_pickups')
        .select(`
          *,
          certificate_requests:request_id (*)
        `)
        .eq('pickup_token', token)
        .single();

      if (pickupError) {
        return { valid: false, message: 'Invalid pickup token' };
      }

      if (!pickup) {
        return { valid: false, message: 'Pickup record not found' };
      }

      // Verify reference number matches
      if (pickup.certificate_requests.reference_number !== referenceNumber) {
        return { valid: false, message: 'Reference number mismatch' };
      }

      // Check if token is expired
      if (new Date() > new Date(pickup.expires_at)) {
        return { valid: false, message: 'Pickup token has expired' };
      }

      // Check if already picked up
      if (pickup.status === 'completed') {
        return { 
          valid: false, 
          message: 'Certificate already picked up',
          pickedUpAt: pickup.picked_up_at
        };
      }

      return {
        valid: true,
        pickup,
        request: pickup.certificate_requests,
        message: 'Valid pickup token'
      };

    } catch (error) {
      console.error('Error verifying pickup token:', error);
      return { valid: false, message: 'Verification failed' };
    }
  }

  async markAsPickedUp(pickupToken, pickedUpBy) {
    try {
      console.log(`Marking certificate as picked up: ${pickupToken}`);

      const { data, error } = await supabase
        .from('certificate_pickups')
        .update({
          status: 'completed',
          picked_up_at: new Date().toISOString(),
          picked_up_by: pickedUpBy
        })
        .eq('pickup_token', pickupToken)
        .select()
        .single();

      if (error) throw error;

      // Also update the certificate request status
      const { error: requestError } = await supabase
        .from('certificate_requests')
        .update({
          status: 'released',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.request_id);

      if (requestError) throw requestError;

      console.log(`Certificate marked as picked up successfully`);
      
      return {
        success: true,
        message: 'Certificate marked as picked up',
        pickedUpAt: data.picked_up_at
      };

    } catch (error) {
      console.error('Error marking certificate as picked up:', error);
      throw error;
    }
  }

  async getPickupHistory(requestId) {
    try {
      const { data, error } = await supabase
        .from('certificate_pickups')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        history: data || []
      };

    } catch (error) {
      console.error('Error getting pickup history:', error);
      throw error;
    }
  }

  // Generate QR code SVG (simple implementation)
  generateQRCodeSVG(data, size = 200) {
    // This is a simple placeholder - in production, use a proper QR code library like 'qrcode'
    const encoded = Buffer.from(data).toString('base64');
    
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        <rect x="10" y="10" width="${size-20}" height="${size-20}" fill="black"/>
        <rect x="20" y="20" width="${size-40}" height="${size-40}" fill="white"/>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
          QR: ${encoded.substring(0, 20)}...
        </text>
      </svg>
    `;
  }
}

module.exports = new QRCodeService();