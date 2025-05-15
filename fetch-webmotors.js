const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchWebmotors() {
  const url = 'https://www.webmotors.com.br/carros/estoque/suzuki/jimny?autocomplete=jimn&autocompleteTerm=SUZUKI%20JIMNY&lkid=1705&tipoveiculo=carros&marca1=SUZUKI&modelo1=JIMNY&kmate=35000&Oportunidades=Vistoriado&page=1';
  let browser;
  
  try {
    console.log('launching browser...');
    
    const launchOptions = {
      headless: false,
      executablePath: process.env.CHROME_PATH,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    };
    
    browser = await puppeteer.launch(launchOptions);
    
    console.log('browser launched, opening page...');
    const page = await browser.newPage();
    
    await page.setDefaultNavigationTimeout(60000);
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log(`navigating to ${url}...`);
    await page.goto(url);
    console.log('initial page load complete');
    
    console.log('waiting for dynamic content to load (5 seconds)...');
    await page.waitForTimeout(5000);
    
    console.log('extracting page content...');
    const html = await page.content();
    
    const $ = cheerio.load(html);
    
    console.log('searching for car listings...');
    const carCards = $('.sc-caa647a2-0, .CardAd, [data-qa="card-card"]');
    console.log(`found ${carCards.length} car listings`);
    
    if (carCards.length === 0) {
      fs.writeFileSync('debug-page.html', html);
      console.log('no listings found, saved html to debug-page.html for review');
      return [];
    }
    
    const listings = [];
    
    carCards.each((_, el) => {
      try {
        const element = $(el);
        const title = element.find('.sc-4b3d4bd7-0, h2, [data-qa="car-title"]').text().trim();
        const price = element.find('.sc-bef75f96-0, [data-qa="price"]').text().trim();
        const imageUrl = element.find('img').attr('src');
        const details = element.find('.sc-71470088-0, [data-qa="car-details"]').text().trim() || element.text().trim();
        
        const color = details.includes('Preto') ? 'Preto' :
                      details.includes('Branco') ? 'Branco' :
                      details.includes('Prata') ? 'Prata' :
                      details.includes('Cinza') ? 'Cinza' :
                      details.includes('Azul') ? 'Azul' : 'Desconhecido';
        
        const link = element.find('a').attr('href');
        const listingUrl = link ? 
          (link.startsWith('http') ? link : `https://www.webmotors.com.br${link.startsWith('/') ? '' : '/'}${link}`) : 
          null;
        
        listings.push({ 
          title, 
          price, 
          imageUrl, 
          details, 
          color,
          url: listingUrl
        });
      } catch (err) {
        console.error('error parsing card:', err.message);
      }
    });
    
    console.log(`successfully parsed ${listings.length} listings`);
    
    const blackJimnys = listings.filter(l => l.color === 'Preto');
    console.log(`found ${blackJimnys.length} black jimnys`);
    
    const resultsDir = './results';
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    fs.writeFileSync(`${resultsDir}/all-jimnys-${timestamp}.json`, JSON.stringify(listings, null, 2));
    console.log(`saved all listings to ${resultsDir}/all-jimnys-${timestamp}.json`);
    
    if (blackJimnys.length > 0) {
      fs.writeFileSync(`${resultsDir}/black-jimnys-${timestamp}.json`, JSON.stringify(blackJimnys, null, 2));
      console.log(`saved black jimnys to ${resultsDir}/black-jimnys-${timestamp}.json`);
      
      console.log('\nblack jimny results:');
      blackJimnys.forEach((jimny, index) => {
        console.log(`\n[${index + 1}] ${jimny.title}`);
        console.log(`price: ${jimny.price}`);
        console.log(`details: ${jimny.details.substring(0, 100)}...`);
        console.log(`url: ${jimny.url}`);
      });
    } else {
      console.log('no black jimnys found in the results');
    }
    
    return blackJimnys;
  } catch (error) {
    console.error('an error occurred:', error);
    return [];
  } finally {
    if (browser) {
      console.log('closing browser...');
      try {
        await browser.close();
        console.log('browser closed successfully');
      } catch (e) {
        console.error('error closing browser:', e.message);
      }
    }
  }
}

fetchWebmotors().then(results => {
  if (results.length > 0) {
    console.log(`\nfound ${results.length} black jimnys in total`);
  } else {
    console.log('no black jimnys found or an error occurred during execution');
  }
}).catch(err => {
  console.error('fatal error:', err);
  process.exit(1);
}););
