const https = require('https');
const cheerio = require('cheerio');
const axios = require('axios');
const Tgind = require('tgind');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});

const agent = new https.Agent({
  rejectUnauthorized: false
});

let bot = new Tgind(process.env.TOKEN, { "start": true })

async function igres(data) {
  try {
    
  let dt = JSON.parse(data)
  let url = `https://termendresult.ignou.ac.in/TermEnd${dt.text}/TermEnd${dt.text}.asp`
  // let url = "https://termendresult.ignou.ac.in/TermEndDec22/TermEndDec22.asp"   
  let response = await axios.get(url, {
    httpsAgent: agent,
  })

  let Cookie;
  // Check for set-cookie header
  if (response.headers['set-cookie']) {
    Cookie = response.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join(';');
  }

  let result = await axios.post(url, {
    eno: dt.eno,
    myhide: "OK"
  }, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie,
    },
    httpsAgent: agent,
  });

  const html = result.data;
  const $ = cheerio.load(html);

  let results = [];
  results.push(`𝗬𝗼𝘂𝗿 𝗶𝗴𝗻𝗼𝘂 𝗥𝗲𝘀𝘂𝗹𝘁 \n𝗦𝘂𝗯𝗷𝗲𝗰𝘁 ㅤㅤㅤㅤ𝗡𝘂𝗺𝗯𝗲𝗿𝘀`);
  $('table tr:not(:first-child)').each(function() {
    const tds = $(this).find('td');
    const courseCode = $(tds[0]).text().trim();
    const marks = $(tds[1]).text().trim();
    const maxMarks = $(tds[2]).text().trim();

    results.push(
      `${courseCode} ㅤㅤㅤㅤ${marks} in ${maxMarks}`
    );
  });
  results = await results.join('\n');
  // console.log(results)
  return results
  } catch (error) {
    console.error(error)
}
}

bot.on("message", async (m) => {
  try {
    
  //    return console.log(m)
  if (m.text.startsWith("/start") || m.text.startsWith("/help"))
    m.send("Use /isc <Your enrollment number> to see result").catch((err)=> {})


  if (m.text.startsWith("/isc")) {
    m.del(m.message_id).catch((err)=>{})
    let enr = m.text.match(/\d+/)
    console.log(enr)
    if (!enr || enr[0].length < 9)
      return m.send("invalid enrollment number use /isc <your enrollment no>").catch((err)=> {})

    const replyMarkup = {
      inline_keyboard: [
        [{ text: "Dec 22", callback_data: JSON.stringify({ "eno": enr[0], "text": "Dec22" }) },
        { text: "June 22", callback_data: JSON.stringify({ "eno": enr[0], "text": "June22" }) },
        { text: "Dec 21", callback_data: JSON.stringify({ "eno": enr[0], "text": "Dec21" }) }],
        [{ text: "June 21", callback_data: JSON.stringify({ "eno": enr[0], "text": "June21" }) },
        { text: "Close", callback_data: "close" }]
      ],
    };

    m.send("For which result you want to see ?", { reply_markup: replyMarkup }).catch((err)=> {})
  }
  } catch (error) {
    console.error("message", error)
        }
})

bot.on("callback_query", async (m) => {
  try {
  bot.answerCallbackQuery(m.id).catch((err)=> {})
  // return console.log(m)
  if (m.data == "close") {
    console.log('yes')
    return m.del(m.message_id).catch((err)=> {})
  }
  m.del(m.message_id).catch((er)=> {})

  let res = await igres(m.data)
  if (res)
    m.send(res).catch((err)=> {})
  else
    m.send("Some error with this enrollment or in date you seleceted").catch((err)=> {})

} catch (error) {
console.error("query", error)
    }
})
