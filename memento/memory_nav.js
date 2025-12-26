document.addEventListener('DOMContentLoaded', () => {
    if (!window.MEMORIES) {
        console.warn('MEMORIES array not found. Make sure memories.js is loaded.');
        return;
    }

    // Get current date from path: .../memories/YYYY/MM/DD/index.html
    const path = window.location.pathname;
    // Regex to match YYYY/MM/DD
    const match = path.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    
    if (!match) return;
    
    const currentDate = `${match[1]}-${match[2]}-${match[3]}`;
    const currentIndex = window.MEMORIES.indexOf(currentDate);
    
    if (currentIndex === -1) return;
    
    const prevDate = currentIndex > 0 ? window.MEMORIES[currentIndex - 1] : null;
    const nextDate = currentIndex < window.MEMORIES.length - 1 ? window.MEMORIES[currentIndex + 1] : null;
    
    // Helper to create link
    const createLink = (dateStr, text, style = {}) => {
        const [y, m, d] = dateStr.split('-');
        const link = document.createElement('a');
        // Navigate up 3 levels from YYYY/MM/DD to memories/ then down to target
        link.href = `../../../${y}/${m}/${d}/index.html`;
        link.textContent = text;
        link.style.textDecoration = 'none';
        link.style.color = '#555';
        link.style.fontWeight = 'bold';
        Object.assign(link.style, style);
        
        link.onmouseover = () => link.style.textDecoration = 'underline';
        link.onmouseout = () => link.style.textDecoration = 'none';
        
        return link;
    };

    // Create Header
    const header = document.createElement('div');
    header.className = 'memory-nav-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    header.style.paddingBottom = '10px';
    header.style.borderBottom = '1px solid #eee';
    header.style.fontFamily = 'inherit';

    const navContainer = document.createElement('div');
    navContainer.style.display = 'flex';
    navContainer.style.alignItems = 'center';
    navContainer.style.gap = '15px';

    if (prevDate) {
        navContainer.appendChild(createLink(prevDate, '←', { fontSize: '1.2em', padding: '0 5px' }));
    }

    const homeLink = document.createElement('a');
    homeLink.href = '../../../../index.html';
    homeLink.textContent = 'Life Calendar';
    homeLink.style.textDecoration = 'none';
    homeLink.style.color = '#333';
    homeLink.style.fontWeight = 'bold';
    homeLink.style.fontSize = '1.2em';
    navContainer.appendChild(homeLink);

    if (nextDate) {
        navContainer.appendChild(createLink(nextDate, '→', { fontSize: '1.2em', padding: '0 5px' }));
    }

    const dateSpan = document.createElement('span');
    const dateObj = new Date(currentDate);
    dateSpan.textContent = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    dateSpan.style.color = '#666';

    header.appendChild(navContainer);
    header.appendChild(dateSpan);

    const footer = document.createElement('div');
    footer.className = 'memory-nav-footer';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.marginTop = '30px';
    footer.style.paddingTop = '20px';
    footer.style.borderTop = '1px solid #eee';
    footer.style.fontFamily = 'inherit';
    
    if (prevDate) {
        footer.appendChild(createLink(prevDate, '← Previous Memory'));
    } else {
        footer.appendChild(document.createElement('div')); // Spacer
    }
    
    if (nextDate) {
        footer.appendChild(createLink(nextDate, 'Next Memory →'));
    } else {
        footer.appendChild(document.createElement('div')); // Spacer
    }
    
    // Append to container if exists, else body
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(header, container.firstChild);
        container.appendChild(footer);
    } else {
        document.body.insertBefore(header, document.body.firstChild);
        document.body.appendChild(footer);
    }
});
