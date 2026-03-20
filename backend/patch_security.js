const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern 1: const tenantId = req.headers['x-tenant-id'] || 'ibaoeste';
    // Pattern 2: const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'] || 'ibaoeste';
    
    const originalContent = content;
    
    // General replacement for the most common pattern
    content = content.replace(
        /const tenantId = (req\.user\?\.tenant_id \|\| )?req\.headers\['x-tenant-id'\] \|\| 'ibaoeste';/g,
        "const tenantId = req.user?.tenant_id || req.headers['x-tenant-id'];\n    if (!tenantId) return res.status(403).json({ success: false, message: 'Tenant context required' });"
    );
    
    // Standalone ibaoeste fallbacks in other contexts
    content = content.replace(
        /\|\| 'ibaoeste'/g,
        "|| req.user?.tenant_id"
    );

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Patched ${file}`);
    }
});
