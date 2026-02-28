const fs = require('fs');
const file = 'c:/Users/SCREENS/OneDrive/Desktop/Admin dashboard/frontend/pages/index.js';
let content = fs.readFileSync(file, 'utf8');

const startStr = '{/* Facilities Section - Enhanced Modern Design */}';
const endStr = '{/* Barangay Achievement and Awards Section */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newSection = `      {/* Facilities Section */}
      <section id="directory" className="py-16 md:py-24 bg-white relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            
            {/* Left Column: Title and Description */}
            <div className="lg:w-1/4 flex flex-col pt-2">
              <div className="border-2 border-gray-100 p-8 shadow-sm bg-white mb-6">
                <h2 className="text-3xl font-normal text-gray-800 leading-tight">
                  Exceptional<br/>
                  <span className="text-[#8dc63f] font-extrabold mt-1 inline-block">Facilities We Offer</span>
                </h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed px-2">
                Discover our state-of-the-art community facilities designed to serve and enhance the lives of Iba O' Este residents. We provide exceptional spaces to support a wide range of community events, public services, and recreational activities.
              </p>
            </div>

            {/* Right Column: Facilities Grid */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {facilities.map((facility, index) => (
                  <div key={index} className="flex flex-col group bg-white transition-all duration-300">
                    <div className="w-full h-48 mb-4 overflow-hidden">
                      <img
                        src={facility.images[0]}
                        alt={facility.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug group-hover:text-[#8dc63f] transition-colors">{facility.name}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                        {facility.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      `;

    content = content.substring(0, startIndex) + newSection + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log('Facilities section successfully replaced.');
} else {
    console.log('Failed to find the bounds to replace.');
}
