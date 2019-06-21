const request = require('request-promise');
const fs = require('fs');
const cheerio = require('cheerio');
const iconv = require('iconv-lite')
const historyData = require('./history.json');

const domain = "https://www.dytt8.net";
const url = domain + '/html/gndy/dyzz/index.html';
const proxy = "http://127.0.0.1:3128";

module.exports = async () => (
    let response = await request(url);
   
    const $ = cheerio.load(response);
    const videoList = [];
    $('.co_content8 ul table a').each(function () {
        const $href = $(this).attr("href").trim();
        if (!historyData.includes($href)) {
            historyData.push($href);
            videoList.push(domain + $href);
        }
    });
    const promises = videoList.map(async (url) => {
        let res = await request({
            url: url,
            proxy: proxy,
            encoding: null
        });
        
        const buf = iconv.decode(res, 'gb2312');
        const $ = cheerio.load(buf, {
            decodeEntities: false
        });

        const result = "";
        const wrap = $('#Zoom');
        const contents = wrap.find("p").first().html().trim();
        const download_url = wrap.find("table a").first().parent().html().trim();

        const path = "./html/" + url.substr(url.lastIndexOf('/') + 1);
        fs.writeFile(path, contents + "<br>" + download_url, () => {});

        result = contents + "<br>" + download_url;

        return await result;
    });

    let result = await Promise.all(promises);
    console.log(result);
    return result;
})