var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite')
const nodemailer = require("nodemailer");

const configData = require('./config.json');
const historyData = require('./history.json');

var domain = "https://www.dytt8.net";
var url = domain + '/html/gndy/dyzz/index.html';

//取页面
const getHTML = function (url) {
    return new Promise((resolve, reject) => {
        request(url, function (error, response, body) {
            if (error) {
                reject(error);
            } else if (response.statusCode == 200) {
                resolve(body);
            }
        });
    });
}

//邮件发送函数
const sendEmail = function(opts) {
    let transporter = nodemailer.createTransport({
        service: 'QQ',
        auth: configData.auth
    }, {
        from: configData.auth.user
    })

    var message = {
        //收件人用逗号间隔
        to: configData.to,
        //信息主题
        subject: opts.subject,
        //内容
        html: opts.html
    }

    return transporter.sendMail(message);
}

const schedule = require('node-schedule');
const SCHEDULE_RULE = '0 30 8 * * *'; //每天8点30分发送
schedule.scheduleJob(SCHEDULE_RULE, () => {
    getHTML(url).then((res) => {
            var $ = cheerio.load(res); //利用cheerio对页面进行解析
            var videoList = [];
            $('.co_content8 ul table a').each(function () {
                var $href = $(this).attr("href").trim();
                if (!historyData.includes($href)) {
                    historyData.push($href);
                    videoList.push(domain + $href);
                }
            });

            fs.writeFile('./js/history.json', JSON.stringify(historyData), () => {
                console.log("record history data finish");
            });

            const promises = videoList.map((url) => {
                return getHTML({
                    url: url,
                    encoding: null
                }).then((res) => {
                    var buf = iconv.decode(res, 'gb2312');
                    var $ = cheerio.load(buf, {
                        decodeEntities: false
                    });

                    var result = "";
                    $('#Zoom').map(function () {
                        var contents = $(this).find("p").first().html().trim();
                        var download_url = $(this).find("table a").first().parent().html().trim();

                        const path = "./html/" + url.substr(url.lastIndexOf('/') + 1);
                        fs.writeFile(path, contents + "<br>" + download_url, () => {});

                        result = contents + "<br>" + download_url;
                    });

                    return result;
                });
            });

            return Promise.all(promises);
        }).then((res) => {
            if (res.length > 0) {
                return sendEmail({
                    subject: "dytt8.net-" + new Date().toLocaleDateString(),
                    html: res.join('<hr><hr><br><br>')
                });
            }
        })
        .then((res) => {
            console.log("sendEmail success~!")
        })
        .catch((err) => {
            console.log(err)
        });
});