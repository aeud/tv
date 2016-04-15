#! /usr/local/bin/node

var request = require('request')
var progress = require('request-progress')
var fs = require('fs')
var readline = require('readline')
var parseString = require('xml2js').parseString
var parameters = require('./parameters.json')

var aaDecode = text => {
    var evalPreamble = "(\uFF9F\u0414\uFF9F) ['_'] ( (\uFF9F\u0414\uFF9F) ['_'] ("
    var decodePreamble = "( (\uFF9F\u0414\uFF9F) ['_'] ("
    var evalPostamble = ") (\uFF9F\u0398\uFF9F)) ('_')"
    var decodePostamble = ") ())"
    text = text.replace(/^\s*/, "").replace(/\s*$/, "")
    if (/^\s*$/.test(text)) return ""
    if (text.lastIndexOf(evalPreamble) < 0) throw new Error("Given code is not encoded as aaencode..")
    var decodingScript = text.replace(evalPreamble, decodePreamble).replace(evalPostamble, decodePostamble)
    return eval(decodingScript)
}

var progession = 0;

request(parameters.feed, (err, resp, body) => {
    parseString(body, (err, resp) => {
        var items = resp.rss.channel[0].item
        items.forEach((item, _i) => {
            console.log(_i, item.title[0])
        })
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        rl.question('Video to download?\t', answer => {
            rl.close()
            var item = items[parseInt(answer)]
            var link = item.link[0]
            var title = item.title[0]
            console.log(title)
            var fileName = /([\w_-]+)\/$/gi.exec(link)[1]
            downloadVideo(link, fileName)
        })
    })
})

var downloadVideo = (url, fileName) => {
    request.get(url, (err, resp, body) => {
        var exec = /https:\/\/openload\.co\/embed\/[\w\-\_]+\//gi.exec(body)
        var link = exec[0]
        request.get(link, (err, resp, body) => {
            var exec = /ﾟωﾟﾉ=.+\) \(\uFF9F\u0398\uFF9F\)\) \('_'\);/gi.exec(body)
            var js = exec[0]
            var window = {}
            eval(aaDecode(js))
            progress(request(window.vs)).on('progress', state => {
                var p = parseInt(100 * state.percentage)
                if (p > progession) {
                    console.log(p + '%')
                    progession = p
                }
            }).pipe(fs.createWriteStream('./' + fileName + '.mp4'))
        })
    })  
}

