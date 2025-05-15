
const puppeteer = require('puppeteer');

async function fetchJimnys() {
  console.log('launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('navigating to webmotors...');
    await page.goto('https://www.webmotors.com.br/carros/estoque/suzuki/jimny?autocomplete=jimn&autocompleteTerm=SUZUKI%20JIMNY&lkid=1705&tipoveiculo=carros&marca1=SUZUKI&modelo1=JIMNY&kmate=35000&Oportunidades=Vistoriado&page=1', {
      waitUntil: 'networkidle2'
    });
    
    console.log('waiting for content to load...');
    await page.waitForSelector('.sc-caa647a2-0', { timeout: 10000 });
    
    // extract data
    const listings = await page.evaluate(() => {
      const cars = [];
      
      document.querySelectorAll('.sc-caa647a2-0').forEach(card => {
        try {
          const titleEl = card.querySelector('.sc-4b3d4bd7-0');
          const priceEl = card.querySelector('.sc-bef75f96-0');
          const imageEl = card.querySelector('img');
          const detailsEl = card.querySelector('.sc-71470088-0');
          
          if (!titleEl || !priceEl) return;
          
          const title = titleEl.textContent.trim();
          const price = priceEl.textContent.trim();
          const imageUrl = imageEl ? imageEl.src : null;
          const details = detailsEl ? detailsEl.textContent.trim() : '';
          
          // try to determine color
          const color = details.includes('Preto') ? 'Preto' : 
                      details.includes('Branco') ? 'Branco' : 
                      details.includes('Prata') ? 'Prata' : 
                      details.includes('Cinza') ? 'Cinza' : 
                      details.includes('Azul') ? 'Azul' : 'Desconhecido';
          
          cars.push({
            title,
            price,
            imageUrl,
            details,
            color
          });
        } catch (e) {
          console.error('error parsing car card:', e);
        }
      });
      
      return cars;
    });
    
    console.log(`found ${listings.length} jimny listings`);
    console.log(listings);
    
    // filter black jimnys
    const blackJimnys = listings.filter(car => car.color === 'Preto');
    console.log(`found ${blackJimnys.length} black jimnys:`);
    console.log(blackJimnys);
    
    return listings;
  } catch (error) {
    console.error('error:', error);
    return [];
  } finally {
    await browser.close();
    console.log('browser closed');
  }
}

fetchJimnys();
