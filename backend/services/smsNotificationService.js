const { supabase } = require('./supabaseClient');

class SMSNotificationService {
  constructor() {
    // In production, you would use services like Twilio, Semaphore, or local SMS gateway
    this.smsProvider = process.env.SMS_PROVIDER || 'mock';
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || 'BARANGAY';
  }

  async sendCertificateReadyNotification(requestId) {
    try {
      console.log(`Sending SMS notification for request ID: ${requestId}`);

      // Get certificate request details
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;
      if (!request) throw new Error('Certificate request not found');

      // Validate phone number
      if (!request.contact_number) {
        console.warn(`No contact number for request ${request.reference_number}`);
        return { success: false, message: 'No contact number provided' };
      }

      // Format phone number (ensure it starts with +63 for Philippines)
      const phoneNumber = this.formatPhoneNumber(request.contact_number);
      
      // Generate message
      const message = this.generateReadyMessage(request);

      // Send SMS based on provider
      let result;
      switch (this.smsProvider) {
        case 'twilio':
          result = await this.sendViaTwilio(phoneNumber, message);
          break;
        case 'semaphore':
          result = await this.sendViaSemaphore(phoneNumber, message);
          break;
        case 'mock':
        default:
          result = await this.sendViaMock(phoneNumber, message);
          break;
      }

      // Log SMS in database
      await this.logSMSNotification(requestId, phoneNumber, message, result);

      return result;

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('63')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+63${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      return `+63${cleaned}`;
    } else {
      return `+63${cleaned}`;
    }
  }

  generateReadyMessage(request) {
    const certificateTypes = {
      'barangay_clearance': 'Barangay Clearance',
      'certificate_of_indigency': 'Certificate of Indigency',
      'barangay_residency': 'Barangay Residency Certificate'
    };

    const certificateName = certificateTypes[request.certificate_type] || 'Certificate';

    return `Good day ${request.full_name}! Your ${certificateName} (Ref: ${request.reference_number}) is now ready for pickup at Barangay Iba O' Este office. Please bring a valid ID. Office hours: Mon-Fri 8AM-5PM. Thank you!`;
  }

  async sendViaTwilio(phoneNumber, message) {
    // Twilio implementation (requires twilio package)
    try {
      if (!this.apiKey) {
        throw new Error('Twilio API key not configured');
      }

      // Mock implementation - replace with actual Twilio code
      console.log(`[TWILIO] Sending SMS to ${phoneNumber}: ${message}`);
      
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // const result = await client.messages.create({
      //   body: message,
      //   from: this.senderId,
      //   to: phoneNumber
      // });

      return {
        success: true,
        provider: 'twilio',
        messageId: `twilio_${Date.now()}`,
        message: 'SMS sent successfully via Twilio'
      };

    } catch (error) {
      return {
        success: false,
        provider: 'twilio',
        error: error.message
      };
    }
  }

  async sendViaSemaphore(phoneNumber, message) {
    // Semaphore SMS implementation (Philippines)
    try {
      if (!this.apiKey) {
        throw new Error('Semaphore API key not configured');
      }

      console.log(`[SEMAPHORE] Sending SMS to ${phoneNumber}: ${message}`);

      // Mock implementation - replace with actual Semaphore API call
      // const response = await fetch('https://api.semaphore.co/api/v4/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     message: message,
      //     number: phoneNumber,
      //     sendername: this.senderId
      //   })
      // });

      return {
        success: true,
        provider: 'semaphore',
        messageId: `semaphore_${Date.now()}`,
        message: 'SMS sent successfully via Semaphore'
      };

    } catch (error) {
      return {
        success: false,
        provider: 'semaphore',
        error: error.message
      };
    }
  }

  async sendViaMock(phoneNumber, message) {
    // Mock SMS service for development/testing
    console.log(`[MOCK SMS] Sending to ${phoneNumber}:`);
    console.log(`Message: ${message}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}`,
      message: 'SMS sent successfully (mock service)'
    };
  }

  async logSMSNotification(requestId, phoneNumber, message, result) {
    try {
      const { error } = await supabase
        .from('sms_notifications')
        .insert([{
          request_id: requestId,
          phone_number: phoneNumber,
          message: message,
          provider: result.provider,
          message_id: result.messageId,
          status: result.success ? 'sent' : 'failed',
          error_message: result.error || null,
          sent_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error logging SMS notification:', error);
      }
    } catch (error) {
      console.error('Error logging SMS notification:', error);
    }
  }

  async sendPickupReminderNotification(requestId) {
    try {
      // Get certificate request details
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      const phoneNumber = this.formatPhoneNumber(request.contact_number);
      const message = `Reminder: Your certificate (Ref: ${request.reference_number}) is still available for pickup at Barangay Iba O' Este office. Please claim within 30 days. Office hours: Mon-Fri 8AM-5PM.`;

      const result = await this.sendViaMock(phoneNumber, message);
      await this.logSMSNotification(requestId, phoneNumber, message, result);

      return result;
    } catch (error) {
      console.error('Error sending pickup reminder:', error);
      throw error;
    }
  }
}

module.exports = new SMSNotificationService();