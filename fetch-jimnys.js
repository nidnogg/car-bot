
const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function fetchJimnys() {
  try {
    console.log('fetching jimnys from webmotors...');
    
    const url = 'https://www.webmotors.com.br/carros/estoque/suzuki/jimny?autocomplete=jimn&autocompleteTerm=SUZUKI%20JIMNY&lkid=1705&tipoveiculo=carros&marca1=SUZUKI&modelo1=JIMNY&kmate=35000&Oportunidades=Vistoriado&page=1';
    
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      }
    });
    
    if (!response.ok) {
      throw new Error(`http error: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('received html, parsing...');
    
    // load html into cheerio
    const $ = cheerio.load(html);
    
    // find all car cards/listings
    const carCards = $('.sc-caa647a2-0');
    console.log(`found ${carCards.length} car listings`);
    
    // extract data from each car card
    const listings = [];
    
    carCards.each((index, element) => {
      try {
        const title = $(element).find('.sc-4b3d4bd7-0').text().trim();
        const price = $(element).find('.sc-bef75f96-0').text().trim();
        const imageUrl = $(element).find('img').attr('src');
        const details = $(element).find('.sc-71470088-0').text().trim();
        const color = details.includes('Preto') ? 'Preto' : 
                    details.includes('Branco') ? 'Branco' : 
                    details.includes('Prata') ? 'Prata' : 
                    details.includes('Cinza') ? 'Cinza' : 
                    details.includes('Azul') ? 'Azul' : 'Desconhecido';
        
        listings.push({
          title,
          price,
          imageUrl,
          details,
          color
        });
      } catch (error) {
        console.error(`error parsing card ${index}:`, error);
      }
    });
    
    console.log('all listings:', listings);
    
    // filter black jimnys
    const blackJimnys = listings.filter(car => car.color === 'Preto');
    console.log('black jimnys found:', blackJimnys.length);
    console.log(blackJimnys);
    
    return listings;
  } catch (error) {
    console.error('error fetching jimnys:', error);
    return [];
  }
}

fetchJimnys();
