// var postcss = require('postcss')
// var prefixer = require("postcss-prefixer")
var path = require('path')
var fs = require('fs-extra')
const namespaceCSS = require('namespace-css-selectors')

module.exports = prefixCss

function prefixCss(directory) {
    let dir = directory
    var cssFolder = path.join(dir, "css")
    // var tempFolder = path.join(cssFolder, "temp")
    // fs.mkdirSync(tempFolder)
    var files = fs.readdirSync(cssFolder)
    files.forEach(file => {
        if (path.extname(file) === ".css") {
            let cssFilePath = path.join(cssFolder, file)
            let css = fs.readFileSync(cssFilePath, "utf8")
            css = ".le-preview { " + css + "}"
            let outputCSS = namespaceCSS(css, ".le-preview")
            // var outputCSS = sass.renderSync({data:css})

            fs.writeFileSync(path.join(tempFolder, file), outputCSS, "utf8")
        }
    })
}