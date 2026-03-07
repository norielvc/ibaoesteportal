const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OfficialReceiptService {
    constructor() {
        this.receiptsDir = path.join(__dirname, '../generated-receipts');
        this.ensureReceiptsDirectory();
    }

    ensureReceiptsDirectory() {
        if (!fs.existsSync(this.receiptsDir)) {
            fs.mkdirSync(this.receiptsDir, { recursive: true });
        }
    }

    async getBarangayConfig() {
        try {
            const { data, error } = await supabase
                .from('barangay_officials')
                .select('*')
                .single();

            if (error) {
                console.error('Error fetching officials config:', error);
                return this.getDefaultConfig();
            }

            return {
                headerInfo: {
                    country: 'Republic of the Philippines',
                    province: 'Province of Bulacan',
                    municipality: 'Municipality of Calumpit',
                    barangayName: "BARANGAY IBA O' ESTE"
                },
                contactInfo: {
                    address: "Iba O' Este, Calumpit, Bulacan",
                    telephone: '(044) 913-1234',
                    email: 'ibaeste.calumpit@gmail.com',
                    contactPerson: 'Barangay Secretary'
                },
                treasurer: data?.treasurer || 'MARIA ELENA C. SANTOS',
                chairman: data?.chairman || 'ALEXANDER C. MANIO'
            };
        } catch (error) {
            console.error('Error in getBarangayConfig:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            headerInfo: {
                country: 'Republic of the Philippines',
                province: 'Province of Bulacan',
                municipality: 'Municipality of Calumpit',
                barangayName: "BARANGAY IBA O' ESTE"
            },
            contactInfo: {
                address: "Iba O' Este, Calumpit, Bulacan",
                telephone: '(044) 913-1234',
                email: 'ibaeste.calumpit@gmail.com',
                contactPerson: 'Barangay Secretary'
            },
            treasurer: 'MARIA ELENA C. SANTOS',
            chairman: 'ALEXANDER C. MANIO'
        };
    }

    async generateOfficialReceipt(requestId, paymentAmount = 100) {
        try {
            console.log(`Generating Official Receipt for request ID: ${requestId}`);

            // Get request details
            const { data: request, error: requestError } = await supabase
                .from('certificate_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (requestError) {
                throw new Error(`Request not found: ${requestError.message}`);
            }

            // Get barangay configuration
            const config = await this.getBarangayConfig();

            // Generate OR number
            const orNumber = await this.generateORNumber();

            // Generate the HTML content
            const htmlContent = await this.generateORContent(request, config, orNumber, paymentAmount);

            // Generate unique filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `OR_${orNumber}_${timestamp}.html`;
            const filePath = path.join(this.receiptsDir, filename);

            // Write the HTML file
            fs.writeFileSync(filePath, htmlContent);

            console.log(`Official Receipt generated successfully: ${filename}`);

            return {
                success: true,
                filePath: filename, // Return just the filename for URL construction
                filename: filename,
                orNumber: orNumber
            };

        } catch (error) {
            console.error('Error generating Official Receipt:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async generateORNumber() {
        try {
            // Get the current year
            const year = new Date().getFullYear();
            const yearSuffix = year.toString().slice(-2); // Last 2 digits of year

            // Get the latest OR number for this year
            const { data: receipts, error } = await supabase
                .from('official_receipts')
                .select('or_number')
                .like('or_number', `${yearSuffix}-%`)
                .order('created_at', { ascending: false })
                .limit(1);

            let nextNumber = 1;
            if (receipts && receipts.length > 0) {
                const lastOR = receipts[0].or_number;
                const lastNumber = parseInt(lastOR.split('-')[1]);
                nextNumber = lastNumber + 1;
            }

            return `${yearSuffix}-${String(nextNumber).padStart(6, '0')}`;
        } catch (error) {
            console.error('Error generating OR number:', error);
            // Fallback to timestamp-based number
            const timestamp = Date.now().toString().slice(-6);
            return `26-${timestamp}`;
        }
    }

    async generateORContent(request, config, orNumber, amount) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const currentTime = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Parse business details
        let businessDetails = {};
        try {
            if (typeof request.details === 'string') {
                businessDetails = JSON.parse(request.details);
            } else if (typeof request.details === 'object') {
                businessDetails = request.details || {};
            }
        } catch (e) {
            console.error('Error parsing business details:', e);
        }

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Official Receipt - ${orNumber}</title>
            <style>
                body { 
                    font-family: 'Times New Roman', serif; 
                    margin: 0; 
                    padding: 20px; 
                    background: white;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .receipt-container { 
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: white; 
                    border: 2px solid #000;
                    padding: 20px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20px; 
                    border-bottom: 2px solid #000;
                    padding-bottom: 15px;
                }
                .title { 
                    font-size: 20px; 
                    font-weight: bold; 
                    margin: 10px 0; 
                    text-transform: uppercase;
                }
                .or-number {
                    font-size: 16px;
                    font-weight: bold;
                    color: #d32f2f;
                    margin: 10px 0;
                }
                .content { 
                    margin: 20px 0; 
                }
                .info-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin: 15px 0;
                }
                .info-table td { 
                    padding: 8px; 
                    border: 1px solid #000; 
                    vertical-align: top;
                }
                .info-table .label { 
                    font-weight: bold; 
                    background: #f9f9f9; 
                    width: 30%;
                }
                .amount-section {
                    background: #f0f0f0;
                    border: 2px solid #000;
                    padding: 15px;
                    margin: 20px 0;
                    text-align: center;
                }
                .amount-text {
                    font-size: 18px;
                    font-weight: bold;
                    color: #d32f2f;
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
                @media print {
                    body { margin: 0; padding: 10px; }
                    .receipt-container { border: none; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <p style="font-size: 14px; margin: 2px 0;">${config.headerInfo.country}</p>
                    <p style="font-size: 14px; margin: 2px 0;">${config.headerInfo.province}</p>
                    <p style="font-size: 14px; margin: 2px 0;">${config.headerInfo.municipality}</p>
                    <p style="font-size: 16px; font-weight: bold; margin: 5px 0; color: #1e40af;">${config.headerInfo.barangayName}</p>
                    <p style="font-size: 12px; color: #d32f2f; font-weight: bold; margin: 5px 0;">OFFICE OF THE BARANGAY TREASURER</p>
                </div>
                
                <div class="title">Official Receipt</div>
                <div class="or-number">OR No: ${orNumber}</div>
                
                <div class="content">
                    <table class="info-table">
                        <tr>
                            <td class="label">Date</td>
                            <td>${currentDate}</td>
                        </tr>
                        <tr>
                            <td class="label">Time</td>
                            <td>${currentTime}</td>
                        </tr>
                        <tr>
                            <td class="label">Received From</td>
                            <td>${(request.full_name || request.applicant_name || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td class="label">Address</td>
                            <td>${(request.address || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td class="label">Business Name</td>
                            <td>${(businessDetails.businessName || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td class="label">Nature of Business</td>
                            <td>${(businessDetails.natureOfBusiness || '').toUpperCase()}</td>
                        </tr>
                        <tr>
                            <td class="label">Reference Number</td>
                            <td>${request.reference_number}</td>
                        </tr>
                    </table>

                    <div class="amount-section">
                        <p style="margin: 0 0 10px 0; font-weight: bold;">AMOUNT RECEIVED</p>
                        <div class="amount-text">₱ ${amount.toFixed(2)}</div>
                        <p style="margin: 10px 0 0 0; font-size: 10px;">
                            (${this.numberToWords(amount)} PESOS ONLY)
                        </p>
                    </div>

                    <table class="info-table">
                        <tr>
                            <td class="label">Payment For</td>
                            <td>BUSINESS PERMIT PROCESSING FEE</td>
                        </tr>
                        <tr>
                            <td class="label">Payment Method</td>
                            <td>CASH</td>
                        </tr>
                    </table>
                </div>

                <div class="signatures">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <p style="font-weight: bold; margin: 5px 0;">PAYOR'S SIGNATURE</p>
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <p style="font-weight: bold; margin: 5px 0;">${config.treasurer}</p>
                        <p style="font-size: 10px; margin: 0;">BARANGAY TREASURER</p>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #666;">
                    <p>This receipt is valid only when properly signed and dated.</p>
                    <p>For inquiries, contact: ${config.contactInfo.telephone} | ${config.contactInfo.email}</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    numberToWords(num) {
        const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
        const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
        const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
        const thousands = ['', 'THOUSAND', 'MILLION', 'BILLION'];

        if (num === 0) return 'ZERO';

        function convertHundreds(n) {
            let result = '';
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' HUNDRED ';
                n %= 100;
            }
            if (n >= 20) {
                result += tens[Math.floor(n / 10)] + ' ';
                n %= 10;
            } else if (n >= 10) {
                result += teens[n - 10] + ' ';
                return result;
            }
            if (n > 0) {
                result += ones[n] + ' ';
            }
            return result;
        }

        let result = '';
        let thousandCounter = 0;

        while (num > 0) {
            if (num % 1000 !== 0) {
                result = convertHundreds(num % 1000) + thousands[thousandCounter] + ' ' + result;
            }
            num = Math.floor(num / 1000);
            thousandCounter++;
        }

        return result.trim();
    }
}

module.exports = new OfficialReceiptService();