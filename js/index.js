var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var iconv = require('iconv-lite')
const nodemailer = require("nodemailer");

var domain = "https://www.dytt8.net";
var url = domain + '/html/gndy/dyzz/index.html';

function downloader(url, callback) {
    //获取页面
    request(url, function (err, res) {
        if (err) {
            callback(err);
        }

        var $ = cheerio.load(res.body.toString()); //利用cheerio对页面进行解析

        var videoList = [];

        $('.co_content8 ul table a').each(function () {
            var $href = $(this).attr("href").trim();
            videoList.push(domain + $href);
        });

        callback(null, videoList);
    });
}

const schedule = require('node-schedule');
const SCHEDULE_RULE = '0 30 8 * * *'; //每天8点30分发送
schedule.scheduleJob(SCHEDULE_RULE, () => {
    downloader(url, function (err, videoList) {
        if (err) {
            return console.log(err);
        }

        var list = [];
        [...videoList].forEach((url) => {
            request({
                url: url,
                encoding: null
            }, function (err, res, body) {
                if (err) {
                    console.error(err);
                }

                var buf = iconv.decode(body, 'gb2312');
                var $ = cheerio.load(buf, {
                    decodeEntities: false
                }); //利用cheerio对页面进行解析

                $('#Zoom').map(function () {
                    var contents = $(this).find("p").first().html().trim();
                    var download_url = $(this).find("table a").first().parent().html().trim();

                    const path = "./html/" + url.substr(url.lastIndexOf('/') + 1);
                    fs.writeFile(path, contents + "<br>" + download_url, () => {});

                    list.push(contents + "<br>" + download_url);
                });

            });
        })

        setTimeout(() => {
            sendEmail({
                to: "517086440@qq.com",
                subject: "dytt8.net",
                html: list.join('<hr><hr><br><br>')
            })
        }, 3000);
    });
});

const configData = require('./config.json');
//生成发送字符串
function formStr(arr) {
    let html = '';
    for (let data of arr) {
        html += `<p><a target="_blank" href="${data.href}">${data.title}</a></p>` // red green blue
    }
    return html;
}

//邮件发送函数
function sendEmail(opts) {
    let transporter = nodemailer.createTransport({
        service: 'QQ',
        auth: configData.auth
    }, {
        from: configData.auth.user
    })

    var message = {
        //收件人用逗号间隔
        to: opts.to,
        //信息主题
        subject: opts.subject,
        //内容
        html: opts.html
    }

    transporter.sendMail(message);
}