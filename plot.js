  $(function() {
  let data = window.data;
  let viewerWidth = $(document).width();
  let viewerHeight = $(document).height();
  let plotType = $('#modeInput1').prop('checked') ? 'linear' : 'radial';

  var zoomListener = d3.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

  let baseSvg = d3.select("#tree-container").append("svg")
  .attr("width", viewerWidth)
  .attr("height", viewerHeight)
  .attr("class", "overlay")
  .call(zoomListener);

  let svgGroup = baseSvg.append("g");
  // if (plotType === 'radial') {
  //   svgGroup.attr("transform", "translate(" + ((viewerWidth / 2) + 100) + "," + (viewerHeight / 2) + ")");
  // } else {
  //   svgGroup.attr("transform", "translate(10,0)");
  // }

  let treemap = d3.tree();

  if (plotType === 'radial') {
    treemap.size([2 * Math.PI, viewerWidth / 2])
           .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);
  } else {
    treemap.size([viewerHeight, viewerWidth]);
  }

  let root = d3.hierarchy(fillColors(data), (d) => d.children);
  // root.x0 = viewerWidth / 2;
  // root.y0 = viewerHeight / 2

  update(root);

  function zoom() {
    svgGroup.attr("transform", d3.event.transform);
  }

  function update(source) {
    let treeData = treemap(root);

    let nodes = treeData.descendants();
    let links = treeData.links();

    //////////
    // link //
    //////////

    let link = svgGroup.selectAll(".link")
      .data(links);
    let linkEnter = link.enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", function(d) { return linkColor(d); });
    if (plotType === 'radial') {
      linkEnter.attr("d", d3.linkRadial().angle(function(d) { return d.x; })
                                    .radius(function(d) { return d.y; }));
    } else {
      linkEnter.attr("d", function(d) {
        return "M" + d.source.y + "," + d.source.x
          + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
          + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
          + " " + d.target.y + "," + d.target.x;
      })
    }

    //////////
    // node //
    //////////

    let node = svgGroup.selectAll(".node").data(nodes);
    let nodeEnter = node.enter().append("g")
      .on('click', function(d) {

      });
      // .attr("class", (d) => "node" + (d.children ? " node--internal" : " node--leaf"))
      // .style("cursor", (d) => d.data.url && "pointer")
    if (plotType === 'radial') {
      nodeEnter.attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")" });
    } else {
      nodeEnter.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    }
    // node circle
    let circle = nodeEnter.append("circle")
      .style("fill", function(d) { return d.data.color })
      .attr("r", function(d) { return 5 - (d.depth / 2); });
    // node text
    let text = nodeEnter.append("text")
      .style("font-size", function(d) { return (20 - d.depth * 2) + "px"; })
      .attr("dy", "0.31em")
      .text(function(d) { return d.data.name; })
      .on('click', function(d) { if (d.data.url) { window.open(d.data.url) } });;
    if (plotType === 'radial') {
      text.attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")translate(0,-" + (20 - (d.depth * 3)) + ")"; });
    } else {
      text.attr("x", 6)
          .attr("text-anchor", "center");
    }
  }

  function radialPoint(x, y) {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
  }

  function fillColors(data) {
    if (data.children) {
      data.children.forEach((d) => fillColors(d));
    }
    if (data.color == undefined && data.children) {
      let colored_node = data.children.find((d) => d.color !== undefined);
      if (colored_node !== undefined) {
        data.color = colored_node.color;
      }
    }
    return data;
  }

  function linkColor(d) {
    if (d.target.data.color) {
      return d.target.data.color;
    }
    return "#333";
  }
});

// let svg = d3.select("svg");
// let height = svg.attr("height");
// let width = svg.attr("width");
// let fileInput = document.getElementById('fileInput');
// fileInput.addEventListener('input', function(event) {
//   d3.json(event.currentTarget.files[0].name, function(e, d) {
//     let type = document.getElementById('modeInput1').checked ? 'linear' : 'radial';
//     plot(d, { type: type });
//   })
// });
// function plot(data, params = {}) {
//   svg.select('g').remove();
//   let g = svg.append("g");
//   if (params.type == 'radial') {
//     g.attr("transform", "translate(" + ((width / 2) + 100) + "," + (height / 2) + ")");
//   } else {
//     g.attr("transform", "translate(10,0)");
//   }
//   let imported = d3.hierarchy(fillColors(data));
//   let tree = d3.tree();
//   if (params.type == 'radial') {
//     tree.size([2 * Math.PI, width / 2])
//       .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth });
//   } else {
//     tree.size([height, width]);
//   }
//   let root = tree(imported);
//   let link = g.selectAll(".link")
//     .data(root.links())
//     .enter()
//     .append("path")
//     .attr("class", "link")
//     .attr("stroke", function(d) { return linkColor(d); });
//   if (params.type == 'radial') {
//     link.attr("d", d3.linkRadial().angle(function(d) { return d.x; })
//                                   .radius(function(d) { return d.y; }));
//   } else {
//     link.attr("d", function(d) {
//       return "M" + d.source.y + "," + d.source.x
//         + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
//         + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
//         + " " + d.target.y + "," + d.target.x;
//     })
//   }
//   let node = g.selectAll(".node")
//     .data(imported.descendants())
//     .enter()
//     .append("g")
//     .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
//     .style("cursor", function(d) { if (d.data.url) { return "pointer"; }})
//     .on('click', function(d) { if (d.data.url) { window.open(d.data.url) } });
//   if (params.type == 'radial') {
//     node.attr("transform", function(d) { return "translate(" + radialPoint(d.x, d.y) + ")" });
//   } else {
//     node.attr("transform", function(d) { console.log(d); return "translate(" + d.y + "," + d.x + ")"; });
//   }
//   node.append("circle")
//     .style("fill", function(d) { return d.data.color })
//     .attr("r", function(d) { return 5 - (d.depth / 2); });
//   let text = node.append("text")
//     .style("font-size", function(d) { return (20 - d.depth * 2) + "px"; })
//     .attr("dy", "0.31em")
//     .text(function(d) { return d.data.name; });
//   if (params.type == 'radial') {
//     text.attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
//       .attr("text-anchor", "middle")
//       .attr("transform", function(d) { return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")translate(0,-" + (20 - (d.depth * 3)) + ")"; });
//   } else {
//     text.attr("x", 6)
//       .attr("text-anchor", "center");
//   }
// }
// function fillColors(data) {
//   if (data.children) {
//     data.children.forEach((d) => fillColors(d));
//   }
//   if (data.color == undefined && data.children) {
//     let colored_node = data.children.find((d) => d.color !== undefined);
//     if (colored_node !== undefined) {
//       data.color = colored_node.color;
//     }
//   }
//   return data;
// }
// function linkColor(d) {
//   if (d.target.data.color) {
//     return d.target.data.color;
//   }
//   return "#333";
// }
// d3.select("#save").on("click", writeDownloadLink);
// function writeDownloadLink() {
//   let html = d3.select("svg")
//     .attr("version", 1.1)
//     .attr("xmlns", "http://www.w3.org/2000/svg")
//     .node().outerHTML;
//   let blob = new Blob([html], { type: "image/svg+xml" });
//   saveAs(blob, "output.svg");
// };
// function radialPoint(x, y) {
//   return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
// }
