var visit = require('unist-util-visit')
var is = require('hast-util-is-element')
var path = require("path")
var counters = {}
var classNames = []

module.exports = attacher
module.exports.reset = reset

function reset() {
    for (var counter in counters) {
        counters[counter] = 1
    }
}

function attacher(options){
    var trackerList = options.trackerList
    trackerList.forEach(tracker => {
        counters[tracker] = 1
        //Create a list of classnames that we will search the DOM for
        classNames.push("Figure#"+tracker)
    })
    return transformer

    function transformer(tree, file) {
        visit(tree, (node) => is(node, "div"), visitor)

        function visitor(node) {
            if (!node.properties.className.some(cname => classNames.includes(cname))) {
                return
            }

            node.tagName = "figure"
            //Get what type of figure it is i.e. Figure#Table, Figure#Simulation, etc.
            let figureType = node.properties.className.filter(cname => classNames.includes(cname))[0]
            figureType = figureType.split("#")[1]
            node.properties.className = figureType
            let caption = {
                type: 'text',
                value: figureType + ' ' + counters[figureType]
            }
            counters[figureType] = counters[figureType] + 1
            let figcaption = {
                type: "element",
                tagName: "figcaption",
                properties: {},
                children: [caption]
            }

            node.children.push(figcaption)
        }
    }
}