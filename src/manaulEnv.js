var visit = require('unist-util-visit-parents')
var is = require('hast-util-is-element')
var path = require("path")
var counters = {}
module.exports = attacher;
module.exports.reset = reset

function reset() {
    for (var counter in counters) {
        counters[counter] = 1
    }
}


function attacher(options) {
    var trackerList = options.trackerList
    trackerList.forEach(tracker => counters[tracker] = 1)

    return transformer

    function transformer(tree, file) {
        visit(tree, (node) => is(node, "div"), visitor)
        // console.log(tree)
        function visitor(node, ancestors) {
            // if (node.properties.className.findIndex(classname => classname === "Exercise") == -1){
            //     return
            // }
            if (!node.properties.className.some(cname => trackerList.includes(cname))) {
                return
            }
            let envType = node.properties.className.filter(cname => trackerList.includes(cname))[0]
            node.type = 'temp'
            let parent = ancestors[ancestors.length-1]
            let text = {
                type: 'text',
                value: envType + ' ' + counters[envType]
            }
            counters[envType] = counters[envType] + 1
            let pnode = {
                type: "element",
                tagName: "p",
                properties: {},
                children: [text]
            }
            let newNode = {
                type: "element",
                tagName: "div",
                properties: {
                    className: [envType + "Heading"]
                },
                children: [pnode, node]
            }

            let nodeIndex = parent.children.findIndex(n => n.type === "temp")
            node.type = "element"
            node.properties.className.push("parsed")
            parent.children[nodeIndex] = newNode
        }
    }
}

