var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")
var width = 1000;
var height = 500;

var voronoi = new Voronoi();
var bbox = {xl: 0, xr: width, yt: 0, yb: height}; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
var sites = [{"x":374,"y":310,"voronoiId":31},{"x":25,"y":320,"voronoiId":33},{"x":392,"y":400,"voronoiId":43},{"x":85,"y":262,"voronoiId":27},{"x":294,"y":123,"voronoiId":9},{"x":475,"y":452,"voronoiId":46},{"x":470,"y":73,"voronoiId":5},{"x":21,"y":500,"voronoiId":48},{"x":354,"y":76,"voronoiId":6},{"x":472,"y":200,"voronoiId":19},{"x":462,"y":149,"voronoiId":14},{"x":71,"y":388,"voronoiId":42},{"x":277,"y":42,"voronoiId":2},{"x":115,"y":488,"voronoiId":47},{"x":484,"y":79,"voronoiId":7},{"x":81,"y":372,"voronoiId":40},{"x":148,"y":500,"voronoiId":49},{"x":135,"y":248,"voronoiId":25},{"x":329,"y":256,"voronoiId":26},{"x":449,"y":371,"voronoiId":39},{"x":95,"y":371,"voronoiId":38},{"x":308,"y":145,"voronoiId":11},{"x":206,"y":329,"voronoiId":35},{"x":78,"y":416,"voronoiId":44},{"x":148,"y":315,"voronoiId":32},{"x":13,"y":150,"voronoiId":15},{"x":359,"y":146,"voronoiId":13},{"x":408,"y":136,"voronoiId":10},{"x":350,"y":199,"voronoiId":18},{"x":421,"y":358,"voronoiId":36},{"x":474,"y":358,"voronoiId":37},{"x":288,"y":291,"voronoiId":29},{"x":347,"y":113,"voronoiId":8},{"x":422,"y":63,"voronoiId":4},{"x":413,"y":323,"voronoiId":34},{"x":151,"y":164,"voronoiId":16},{"x":288,"y":385,"voronoiId":41},{"x":58,"y":220,"voronoiId":20},{"x":396,"y":145,"voronoiId":12},{"x":39,"y":282,"voronoiId":28},{"x":494,"y":229,"voronoiId":22},{"x":310,"y":46,"voronoiId":3},{"x":430,"y":233,"voronoiId":24},{"x":154,"y":5,"voronoiId":0},{"x":496,"y":229,"voronoiId":23},{"x":237,"y":168,"voronoiId":17},{"x":378,"y":427,"voronoiId":45},{"x":248,"y":221,"voronoiId":21},{"x":137,"y":27,"voronoiId":1},{"x":104,"y":299,"voronoiId":30}]

const sitesCount = 512
sites = newSites(sitesCount)
function newSites(count) {return _.range(count).map( () => ({x: _.random(width), y: _.random(height)}))}

//const colors = "green blue yellow brown fuchsia black aqua lime pink maroon".split(' ')
const colors = _.range(16).map(i => '#' + _.random(0xfff).toString(16))
// a 'vertex' is an object exhibiting 'x' and 'y' properties. The
// Voronoi object will add a unique 'voronoiId' property to all
// sites. The 'voronoiId' can be used as a key to lookup the associated cell
// in diagram.cells.


var diagram = voronoi.compute(sites, bbox);
diagram = relax(relax(relax(relax(diagram))))
var err = 1
while(err){
  try{
    drawDiagram(ctx, diagram, colors)
    err = false
  } catch(e){
    err = true
  }
}

function drawDiagram(ctx, diagram, colors){
  ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height)
  ctx.fillStyle="red"
  diagram.cells.forEach(c => {
    // circle(ctx,c.site.x, c.site.y,1)
  })

  var cell = _.find(diagram.cells, (c) => !c.color)
  const provinces = colors.map(color => {
    const province = colorDiagram(diagram, color, sitesCount/colors.length, cell)
    province.forEach(cell => drawCell(ctx, cell))
    const halfedges = _.flatten(province.map(c => c.halfedges))
    const rSites = halfedges.map(h => h.edge.rSite).filter(s => s)
    const rCells = rSites.map(s => findCell(diagram.cells, s))
    const cells = rCells.filter(c => !c.color)
    // console.log(cells)
    cell = _.sample(cells)
    return province
  })

  const borders = provinces.map(p => {
    return _.flatten(p.map(cell => {
      return cell.halfedges.filter(h => {
        const cell1 = findCell(diagram.cells, h.edge.rSite)
        const cell2 = findCell(diagram.cells, h.edge.lSite)
        return cell1 && cell2 && cell1.color !== cell2.color
      })
    }))
  })
  // diagram.cells.forEach(c => {
  //   drawCell(ctx, c)
  // })
  borders.forEach(provinceBorder => {
    provinceBorder.forEach(h => {
        const path = new Path2D()
        var p1 = h.getStartpoint()
        var p2 = h.getEndpoint()
        path.moveTo(p1.x, p1.y)
        path.lineTo(p1.x, p1.y)
        path.lineTo(p2.x, p2.y)
        ctx.stroke(path)
    })
  })
}
function drawCell(ctx, cell){
  var path = new Path2D()
    path.moveTo(cell.halfedges[0].edge.va.x, cell.halfedges[0].edge.va.y)
    ctx.strokeStyle= "black"
    path = cell.halfedges
      .reduce((path, h) => {
        var p1 = h.getStartpoint()
        var p2 = h.getEndpoint()
        path.lineTo(p1.x, p1.y)
        path.lineTo(p2.x, p2.y)
        return path
      }, path)
    ctx.fillStyle = cell.color || 'black';
    ctx.fill(path)
}
function colorDiagram(diagram, color, count, startCell){
  var queue = [startCell]
  var result = [startCell]
  while(queue.length != 0 && count > 0){
    var c = queue.shift()
    c.halfedges.forEach(h => {
      var e = h.edge
      var nextSite = e.rSite
      if(nextSite && count){
        var nextCell = findCell(diagram.cells, nextSite)
        if(!nextCell.color){
          nextCell.color = color;
          queue.push(nextCell)
          result.push(nextCell)
          count -= 1;
        }
      }
    })
    if(count > 0 && queue.length == 0) {
      var nextCell = _.find(diagram.cells, c => !c.color)
      nextCell && (nextCell.color = color)
      nextCell && queue.push(nextCell) && count--
      nextCell && result.push(nextCell)
    }
  }
  return result
}

function line(ctx, x1,y1, x2, y2) {
  var l = new Path2D()
  l.moveTo(x1,y1)
  l.lineTo(x2,y2)
  ctx.stroke(l)
}

function circle(ctx, x,y,radius){
  var arc = new Path2D();
  arc.arc(x,y,radius,0,2*Math.PI)
  ctx.fill(arc)
}

function findCell(cells, site){
  return _.find(cells, (cell) => {
    return site && cell.site.voronoiId == site.voronoiId
  })
}

function cellCentroid (cell) {
  var x = 0, y = 0,
    halfedges = cell.halfedges,
    iHalfedge = halfedges.length,
    halfedge,
    v, p1, p2;
  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge];
    p1 = halfedge.getStartpoint();
    p2 = halfedge.getEndpoint();
    v = p1.x*p2.y - p2.x*p1.y;
    x += (p1.x+p2.x) * v;
    y += (p1.y+p2.y) * v;
    }
  v = cellArea(cell) * 6;
  return {x:x/v,y:y/v};
}

function cellArea (cell) {
  var area = 0,
    halfedges = cell.halfedges,
    iHalfedge = halfedges.length,
    halfedge,
    p1, p2;
  while (iHalfedge--) {
    halfedge = halfedges[iHalfedge];
    p1 = halfedge.getStartpoint();
    p2 = halfedge.getEndpoint();
    area += p1.x * p2.y;
    area -= p1.y * p2.x;
    }
  area /= 2;
  return area;
}
function relax(diagram) {
  var newSites = diagram.cells.map(cellCentroid)
  return voronoi.compute(newSites, bbox)
}
function distance(p1, p2) {
  var dx = p1.x-p2.x;
  var dy = p1.y-p2.y
  return Math.sqrt(dx*dx+dy*dy)
}


function drawPath(ps){
  var path = new Path2D()
  path.moveTo(ps[0].x, ps[0].y)
  ps.forEach(p => path.lineTo(p.x, p.y))
  return path;
}

function getColorFactory(colors){
  var cs = _.keys(colors).map( (k) => {
    return {color: k, count: colors[k]}
  })
  return function(){
    var result = {color: cs[0].color, hasNext: true}
    cs[0].count -= 1;
    if(cs[0].count == 0){
      cs.shift()
      result.hasNext = false
    }
    return result
  }
}
