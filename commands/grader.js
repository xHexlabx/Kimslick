const { ButtonInteraction, ActionRowBuilder, ButtonBuilder , ButtonStyle } = require('discord.js')
const mongoose = require('mongoose')
const posnSchema = require('../posn-schema')
const puppeteer = require ('puppeteer')
const { CommandType , user } = require("wokcommands");

async function posn(userdata , channel , user ) {
    
    const browser = await puppeteer.launch({
        headless: true,
        // args: ['--no-sandbox'] ,
        // executablePath: '\\node_modules\\chromium\\lib\\chromium\\chrome-win\\chrome.exe',
        ignoreHTTPSErrors: true,
        
        // userDataDir: '%userprofile%\\AppData\\Local\\Google\\Chrome\\User Data\\AllowCookies'
      })

    const page = await browser.newPage();

    await page.goto('https://posnwu.xyz/', { waitUntil: 'networkidle0' }); // wait until page load

    await page.type('#login', userdata.user_name);
    await page.type('#password', userdata.password);

    await Promise.all([
        page.click('input[type=submit]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    
    const size = await page.evaluate(() => {
        const size = Array.from(document.querySelectorAll('body > div.row > div.col-md-7 > table > tbody > tr')).length
        return size;
    });

    let score  = 0 , completed = 0 ;

    for(let i = 1 ; i <= size ; i ++ ){
      
      let element = await page.waitForXPath(`/html/body/div[2]/div[1]/table/tbody/tr[${i}]/td[4]`)
      let text = await page.evaluate( (element) => element.textContent  , element)

      if(text.length > 80){

        let elements = await page.waitForXPath(`/html/body/div[2]/div[1]/table/tbody/tr[${i}]/td[4]/text()[4]`)
        let point = await page.evaluate( (element) => parseInt(element.textContent.replace(/\D/g, ""))  , elements)

        if(point == 100)completed ++ 
        score += point 
      }
      
    }
    browser.close()
    
    console.log(score);
    user.send({
        content : `@${user.tag}\nได้คะแนน ${score}/${size * 100} \nคิดเป็น ${(score / size).toFixed(2)}% \nได้คะแนนเต็ม ${completed} ข้อ / ${size} ข้อ` ,
    })
}

async function posn2(userdata , channel , user ) {
    
    const browser = await puppeteer.launch({
        // headless: true,
        // executablePath: '\\node_modules\\chromium\\lib\\chromium\\chrome-win\\chrome.exe',
        ignoreHTTPSErrors: true,
        
        // userDataDir: '%userprofile%\\AppData\\Local\\Google\\Chrome\\User Data\\AllowCookies'
      })

    const page = await browser.newPage();

    await page.goto('https://posnwu.xyz/', { waitUntil: 'networkidle0' }); // wait until page load

    await page.type('#login', userdata.user_name);
    await page.type('#password', userdata.password);

    await Promise.all([
        page.click('input[type=submit]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    
    const size = await page.evaluate(() => {
        const size = Array.from(document.querySelectorAll('body > div.row > div.col-md-7 > table > tbody > tr')).length
        return size;
    });

    let score  = 0 , completed = 0 ;

    for(let i = 1 ; i <= size ; i ++ ){
      
      let element = await page.waitForXPath(`/html/body/div[2]/div[1]/table/tbody/tr[${i}]/td[4]`)
      let text = await page.evaluate( (element) => element.textContent  , element)

      if(text.length > 80){

        let elements = await page.waitForXPath(`/html/body/div[2]/div[1]/table/tbody/tr[${i}]/td[4]/text()[4]`)
        let point = await page.evaluate( (element) => parseInt(element.textContent.replace(/\D/g, ""))  , elements)

        if(point == 100)completed ++ 
        score += point 
      }
      
    }
    browser.close()
    
    console.log(score);
    channel.send({
        content : `@${user.tag}\nได้คะแนน ${score}/${size * 100} \nคิดเป็น ${(score / size).toFixed(2)}% \nได้คะแนนเต็ม ${completed} ข้อ / ${size} ข้อ` ,
        ephemeral : true
    })
}

module.exports = {

    description : 'button test' ,
    type: CommandType.BOTH,
    
    callback : async (res) => {

        const { interaction , channel , message , user} = res 
        if(interaction){
            const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                
                .setCustomId('posnpublic')
                .setLabel('Public Posn')
                .setStyle(ButtonStyle.Success)
            )
            .addComponents(
                new ButtonBuilder()
                .setCustomId('posn')
                .setLabel('Posn WU')
                .setStyle(ButtonStyle.Primary)
            )
            
            const linkrow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()

                .setURL('https://beta.programming.in.th/')
                .setLabel('Beta link')
                .setStyle(ButtonStyle.Link)
            )
            .addComponents(
                new ButtonBuilder()

                .setURL('https://posnwu.xyz/main/list')
                .setLabel('Posn link')
                .setStyle(ButtonStyle.Link)
            )
        
            await interaction.reply({
                content : 'เลือกดูคะแนนได้เลย! (●◡●)' ,
                components : [row , linkrow] ,
                ephemeral : true 
            })

            const filter = (btnInt) => btnInt.user.id === interaction.user.id;
            const collector = channel.createMessageComponentCollector({ filter, time: 20000 });

            collector.on('collect', async (btnInt) => {


                if(btnInt.customId == 'posn'){

                    await mongoose.connect(`${process.env.MongoURI}`, {
                        keepAlive : true
                    })

                    const userdata = await posnSchema.findOne({user_id : `${btnInt.user.id}`})

                    await btnInt.reply({
                        content : `${'calculating...'}` ,
                        ephemeral : true
                    })

                    posn(userdata , channel , user)

                }
                else if(btnInt.customId == 'posnpublic'){
                    await mongoose.connect(`${process.env.MongoURI}`, {
                        keepAlive : true
                    })

                    const userdata = await posnSchema.findOne({user_id : `${btnInt.user.id}`})

                    await btnInt.reply({
                        content : `${'calculating...'}` ,
                        ephemeral : true
                    })

                    posn2(userdata , channel , user)
                }
            });

            collector.on('end', collected => {
                console.log(`Collected ${collected.size} items`);
            });
        
        }
    }
} 