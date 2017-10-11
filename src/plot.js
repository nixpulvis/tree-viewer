$(function() {
  let data = window.data;
  let viewerWidth = $(document).width();
  let viewerHeight = $(document).height();
  let plotType = $('#modeInput1').prop('checked') ? 'linear' : 'radial';
  let xOffset = (plotType === 'radial') ? ((viewerWidth / 2) + 100) : 10;
  let yOffset = (plotType === 'radial') ? (viewerHeight / 2) : 0;

  // TODO: Chrome.
  // TODO: config height for line height.
  // TODO: Link color.

  let zoomListener = d3.zoom()
    .scaleExtent([0.1, 3])
    .on("zoom", zoom);

  let initialTransform = d3.zoomIdentity.translate(xOffset, yOffset);

  let baseSvg = d3.select("#tree-container").append("svg")
  .attr("width", viewerWidth)
  .attr("height", viewerHeight)
  .attr("class", "overlay")
  .call(zoomListener);

  let wrapperGroup = baseSvg.append("g")
    .attr("transform", "translate(" + xOffset + "," + yOffset + ")");
  let svgGroup = wrapperGroup.append("g");

  let treemap = d3.tree();

  if (plotType === 'radial') {
    treemap.size([2 * Math.PI, viewerWidth / 2])
           .separation((a, b) => (a.parent == b.parent ? 1 : 5) / a.depth);
  } else {
    treemap.size([viewerHeight, viewerWidth]);
  }

  let root = d3.hierarchy(fillColors(data), (d) => d.children);

  update(root);

  // HACK
  $('#update').on('click', (e) => location.reload());

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
      .attr("class", (d) => "node" + (d.children ? " node--internal" : " node--leaf"));
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
      .style("cursor", (d) => d.data.url && "pointer")
      .on('click', function(d) { if (d.data.url) { window.open(d.data.url) } });
    if (plotType === 'radial') {
      text.attr("x", function(d) { return d.x < Math.PI === !d.children ? 6 : -6; })
          .attr("text-anchor", "middle")
          .attr("transform", function(d) {
            if (d.parent) {
              return "rotate(" + (d.x < Math.PI ? d.x - Math.PI / 2 : d.x + Math.PI / 2) * 180 / Math.PI + ")translate(0,-" + (20 - (d.depth * 3)) + ")";
            } else {
              return "translate(0,-" + (20 - (d.depth * 3)) + ")";
            }
          });
    } else {
      text.attr("x", (d) => d.parent ? 6 : -6)
          .attr("text-anchor", (d) => d.parent ? "center" : "end");
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
