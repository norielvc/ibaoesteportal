import { useState } from 'react';
import { useRouter } from 'next/router';
import { CheckCircle, X, Star, Zap, Crown, Shield, ChevronDown, ChevronUp } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 1499,
    setup: 5000,
    description: 'Perfect for small barangays getting started with digital services.',
    icon: Zap,
    color: 'blue',
    popular: false,
    requests: '300 requests/month',
    staff: '3 staff + 1 admin',
    support: 'Email (3–5 days)',
    training: '1 training call',
    features: [
      'Barangay public website',
      'Barangay name, logo & color branding',
      'News & Events carousel',
      'Officials directory with photos',
      'Contact section with hotlines',
      'Live clock display',
      'Mobile responsive',
      '3 certificate types (Clearance, Indigency, Residency)',
      '2-step approval workflow',
      'Email notification on submission',
      'PDF certificate generation',
      'Reference number & status tracking',
    ],
    notIncluded: [
      'Facilities & Programs sections',
      'Achievements & Awards section',
      'All 11 certificate types',
      'Full multi-step workflow',
      'Official Receipt (OR) generation',
      'Physical Inspection Report',
      'Signature capture',
      'QR attendance system',
      'Analytics dashboard',
      'Custom domain',
    ]
  },
  {
    name: 'Standard',
    price: 2999,
    setup: 8000,
    description: 'Most popular. Full-featured system for active barangays.',
    icon: Star,
    color: 'green',
    popular: true,
    requests: '2,000 requests/month',
    staff: '8 staff + 1 admin',
    support: 'Email (1–2 days)',
    training: '2 training calls',
    features: [
      'Everything in Starter',
      'Facilities section with image gallery',
      'Barangay Programs section',
      'Achievements & Awards section',
      'Hero news carousel with animations',
      'All 11 certificate & document types',
      'Business Permit with Physical Inspection',
      'Full multi-step workflow (Staff → Secretary → Captain → Releasing)',
      'Configurable workflow per certificate type',
      'Approve / Reject / Return / Send Back actions',
      'Email notifications at every step',
      'Official Receipt (OR) generation + PDF',
      'Pickup verification with digital signature',
      'Request history & audit trail',
      'Resident database lookup',
    ],
    notIncluded: [
      'Custom domain',
      'Custom color theme',
      'QR attendance system',
      'Analytics dashboard',
      'Bulk data export',
      'Dedicated support line',
    ]
  },
  {
    name: 'Pro',
    price: 4999,
    setup: 10000,
    description: 'For high-volume or urban barangays that need everything.',
    icon: Crown,
    color: 'purple',
    popular: false,
    requests: 'Unlimited',
    staff: 'Unlimited',
    support: 'Priority (same-day)',
    training: '3 calls + 30-day support',
    features: [
      'Everything in Standard',
      'Custom domain (e.g. yourbrgy.gov.ph)',
      'Custom color theme',
      'Unlimited staff accounts',
      'Unlimited requests/month',
      'QR code employee attendance system',
      'Analytics dashboard',
      'Bulk data export (Excel/CSV)',
      'Priority same-day support',
      'Dedicated WhatsApp/Viber support line',
      '30-day post-launch monitoring',
    ],
    notIncluded: []
  }
];

const addons = [
  {
    category: 'Recurring Add-ons',
    items: [
      { name: 'Extra staff accounts (5 slots)', price: '₱500 / month' },
      { name: 'Extra request capacity (+500/month)', price: '₱300 / month' },
    ]
  },
  {
    category: 'One-Time Add-ons',
    items: [
      { name: 'Additional training session (1 hour)', price: '₱800' },
      { name: 'Custom certificate template design', price: '₱3,000' },
      { name: 'Data migration from old system', price: '₱5,000' },
    ]
  },
  {
    category: 'Custom Request Form',
    description: 'Add a new certificate/document type beyond included forms.',
    items: [
      { name: 'Simple form (basic fields, 1–2 step workflow)', price: '₱5,000' },
      { name: 'Standard form (multiple fields, full workflow)', price: '₱8,000' },
      { name: 'Complex form (conditional fields, inspection, OR)', price: '₱12,000' },
    ]
  },
  {
    category: 'Additional Landing Page Section',
    description: 'Add a new section to your public barangay website.',
    items: [
      { name: 'Simple section (text + image, static)', price: '₱3,000' },
      { name: 'Standard section (CMS / admin-editable)', price: '₱5,000' },
      { name: 'Complex section (gallery, carousel, dynamic)', price: '₱8,000' },
    ]
  }
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes, we offer a 30-day demo so you can see the system live before committing.' },
  { q: 'Can we upgrade our plan later?', a: 'Absolutely. You can upgrade anytime and we will prorate the difference.' },
  { q: 'What happens to our data if we cancel?', a: 'Your data remains accessible for 30 days after cancellation. We can export everything for you.' },
  { q: 'Is this compliant with the Data Privacy Act?', a: 'Yes. The system is compliant with RA 10173 (Data Privacy Act of 2012). Data is encrypted and backed up daily.' },
  { q: 'Do you provide on-site training?', a: 'Yes, on-site training is available. Online training via Zoom/Meet is included in all plans.' },
  { q: 'Can we add more certificate types not in the list?', a: 'Yes, through our Custom Request Form add-on. Pricing depends on complexity.' }
];

const colorMap = {
  blue:   { badge: 'bg-blue-100 text-blue-700',   button: 'bg-blue-600 hover:bg-blue-700',     icon: 'bg-blue-100 text-blue-600',   border: 'border-blue-200',  ring: 'ring-blue-200'  },
  green:  { badge: 'bg-green-100 text-green-700',  button: 'bg-[#008000] hover:bg-[#006400]',   icon: 'bg-green-100 text-green-600', border: 'border-green-400', ring: 'ring-green-300' },
  purple: { badge: 'bg-purple-100 text-purple-700',button: 'bg-purple-600 hover:bg-purple-700', icon: 'bg-purple-100 text-purple-600',border: 'border-purple-200',ring: 'ring-purple-200'},
};

export default function PricingPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#004700] to-[#001a00] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">BarangayPortal</h1>
              <p className="text-green-300 text-xs">Digital Services for Every Barangay</p>
            </div>
          </div>
          <button onClick={() => router.push('/')} className="text-green-200 hover:text-white text-sm font-medium transition-colors">
            ← Back to Portal
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#001a00] to-gray-50 pt-16 pb-24 text-center px-4">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
          Subscription Plans
        </span>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Simple, transparent pricing
        </h2>
        <p className="text-green-200 text-lg max-w-2xl mx-auto">
          Give your barangay a professional website and complete document management system. No hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const colors = colorMap[plan.color];
            return (
              <div key={plan.name} className={`relative bg-white rounded-2xl shadow-lg border-2 flex flex-col overflow-hidden ${plan.popular ? `${colors.border} ring-4 ${colors.ring}` : 'border-gray-100'}`}>
                {plan.popular && (
                  <div className="bg-[#008000] text-white text-xs font-bold text-center py-2 tracking-widest uppercase">
                    Most Popular
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>{plan.requests}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">{plan.description}</p>
                  <div className="mb-1">
                    <span className="text-4xl font-extrabold text-gray-900">₱{plan.price.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm"> / month</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">+ ₱{plan.setup.toLocaleString()} one-time setup fee</p>
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-600">
                    <div><span className="font-semibold block text-gray-800">Staff Accounts</span>{plan.staff}</div>
                    <div><span className="font-semibold block text-gray-800">Support</span>{plan.support}</div>
                    <div className="col-span-2"><span className="font-semibold block text-gray-800">Training</span>{plan.training}</div>
                  </div>
                  <button className={`w-full ${colors.button} text-white py-3 rounded-xl font-bold text-sm transition-all mb-8`}>
                    Get Started
                  </button>
                  <div className="space-y-2 mb-6">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  {plan.notIncluded.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                      {plan.notIncluded.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <X className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LGU Enterprise Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="bg-gradient-to-r from-[#004700] to-[#001a00] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-green-300 text-xs font-bold uppercase tracking-widest">LGU Enterprise</span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-1 mb-2">Deploying to multiple barangays?</h3>
            <p className="text-green-200 text-sm max-w-xl">
              Get a centralized LGU dashboard, bulk deployment, unified reporting, SLA guarantee, and a dedicated account manager.
              Priced per barangay count — starting at ₱25,000/month.
            </p>
          </div>
          <button className="shrink-0 bg-white text-[#004700] font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-all text-sm">
            Contact Us
          </button>
        </div>
      </div>

      {/* Add-ons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Add-ons</h2>
          <p className="text-gray-500">Extend your plan with exactly what you need.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {addons.map((group, gi) => (
            <div key={gi} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{group.category}</h3>
              {group.description && <p className="text-sm text-gray-500 mb-4">{group.description}</p>}
              <div className="divide-y divide-gray-50">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-center justify-between py-3">
                    <span className="text-sm text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-gray-900 shrink-0 ml-4">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Frequently Asked Questions</h2>
          <p className="text-gray-500">Everything you need to know before getting started.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-[#004700] to-[#001a00] py-16 text-center px-4">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to modernize your barangay?</h2>
        <p className="text-green-200 mb-8 max-w-xl mx-auto">
          Contact us today for a free demo. We will walk you through the system and help you pick the right plan.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:[your@email.com]" className="bg-white text-[#004700] font-bold px-8 py-3 rounded-xl hover:bg-green-50 transition-all text-sm">
            Email Us
          </a>
          <a href="https://m.me/[yourpage]" className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-xl hover:bg-white/10 transition-all text-sm">
            Message on Facebook
          </a>
        </div>
      </div>

    </div>
  );
}
