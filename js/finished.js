'use strict';

(function () {

  let data = "no data";
  let allData = "no data"
  let svgContainer = ""; // keep SVG reference in global scope
  var selected = "";
  var countries = new Map();
  var valueLine;
  var div;

  // load data and make scatter plot after window loads
  window.onload = function () {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 1500)
      .attr('height', 900);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allData = csvData;
        makeScatterPlot('AUS');
      });
  }

    // Returns the rows where the time time field is equal to the year
    function filterByCountry(country) {
      data = allData.filter((row) => row['location'] == country);
    }

  // make scatter plot with trend line
  function makeScatterPlot(country) {

    filterByCountry(country)

    // get arrays of fertility rate data and life Expectancy data
    let time = data.map((row) => parseFloat(row["time"]));
    let pop_mlns = data.map((row) => parseFloat(row["pop_mlns"]));

    // find data limits
    let axesLimits = findMinMax(time, pop_mlns);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns");


    var dropDown = d3.select("body").append("select")
      .attr("name", "location");

    var options = dropDown.selectAll("option")
      .data(d3.map(allData, function (d) { return d.location; }).keys())
      .enter()
      .append("option");

    options.text(function (d) { return d; })
      .attr("value", function (d) { return d; });


    dropDown.on("change", function () {
      selected = this.value;
      filterByCountry(selected)
      updateGraph(mapFunctions);
    });



    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  var updateGraph = function (map) {
    let xMap = map.x;
    // Select all of the grouped elements and update the data
    let time = data.map((row) => parseFloat(row["time"]));
    let pop_mlns = data.map((row) => parseFloat(row["pop_mlns"]));
    let limits = findMinMax(time, pop_mlns);
    let yValue = function (d) { return +d["pop_mlns"] }
    let yScale = d3.scaleLinear()
    .domain([limits.yMax + 3, limits.yMin - 5]) // give domain buffer
    .range([50, 700]);

    let yMap = function (d) { return yScale(yValue(d)); };

    let yAxis = d3.axisLeft().scale(yScale);

    valueLine = d3.line()
    .x(function (d) { return map.xScale(d.time); })
    .y(function (d) { return yScale(yValue(d)); })

    svgContainer.select(".y.axis")
    .transition() // change the y axis
      .duration(750)
      .call(yAxis);

    var selectedDots = svgContainer.selectAll(".dot")
      .data(data).enter();

      
      selectedDots
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 5)
      .attr('location', (d) => d.location)
      .attr('fill', 'steelblue')
      .style('opacity', .6)
      .attr("stroke-width", .5)
      .attr("stroke", "black")
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1);
        div.html()
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

      svgContainer.selectAll("circle")
      .data(data).exit().remove().transition();
      

      selectedDots
      .selectAll("circle")
      .data(data)
      .transition()
      .duration(1000)
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 5)
      .attr('location', (d) => d.location)

    // Select all the lines and transition to new positions
    selectedDots.selectAll("path.line")
      .data(data)
      .transition()
      .duration(1000)
      .attr("d", function (d) {
        return valueLine(data)
      })


  }


  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 400)
      .attr('y', 40)
      .style('font-size', '20pt')
      .text("Population over time");

    svgContainer.append('text')
      .attr('x', 500)
      .attr('y', 770)
      .style('font-size', '15pt')
      .text('Years');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 450)rotate(-90)')
      .style('font-size', '15pt')
      .text('Population (Millions)');
  }

  function createDiv(){

    // make tooltip
    div = d3.select("body").append("svg")
      .attr("class", "tooltip")
      .attr('width', 300)
      .attr('height', 300)
      .style("opacity", 0);

      div.append('text')
      .attr('transform', 'translate(-175, 225)rotate(-90)')
      .attr('y',  200)
      .style('font-size', '12pt')
      .text('Life Expectancy');

      div.append('text')
      .attr('x', 100)
      .attr('y', 285)
      .style('font-size', '12pt')
      .text('Fertility Rate');


      let xMin = d3.min(data.map((row) => parseFloat(row["fertility_rate"])));
      let xMax = d3.max(data.map((row) => parseFloat(row["fertility_rate"])));
  
      // get min/max y values
      let yMin = d3.min(data.map((row) => parseFloat(row["life_expectancy"])));
      let yMax = d3.max(data.map((row) => parseFloat(row["life_expectancy"])));

    // return x value from a row of data
    let xValue = function (d) { return +d["fertility_rate"]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([xMin - .75, xMax + 3.5])
      .range([50, 300]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    div.append("g")
      .attr('transform', 'translate(0, 250)')
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .style('font-size', '8px')
      .attr("dx", "-1em")
      .attr("dy", "-.8em")
      .attr("transform", "rotate(-90)")
      .text(d => d);

    // return y value from a row of data
    let yValue = function (d) { return +d["life_expectancy"] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([yMax + 3, yMin - 30]) // give domain buffer
      .range([0, 250]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    div.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

      var dots = div.selectAll('.dot2')
      .data(allData)
      .enter()

      dots
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 5)
      .attr('location', (d) => d.location)
      .attr('fill', 'steelblue')
      .style('opacity', .6)
      .attr("stroke-width", .5)
      .attr("stroke", "black");

    return div;
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    div = createDiv();

    // append data to SVG and plot as points
    var dots = svgContainer.selectAll('.dot')
      .data(data)
      .enter()

      dots
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 5)
      .attr('location', (d) => d.location)
      .attr('fill', 'steelblue')
      .style('opacity', .6)
      .attr("stroke-width", .5)
      .attr("stroke", "black")
      // add tooltip functionality to points
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", 1)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

      var x = d3.scaleLinear()
      .range([50, 1000]);
      var y = d3.scaleLinear()
      .range([50, 700]);

    valueLine = d3.line()
      .x(function (d) { return map.xScale(d.time); })
      .y(function (d) { return map.yScale(d.pop_mlns); })

    svgContainer.append("g")
    .append("path")
    .data(data)
    .attr("class", "line")
    .attr("d", valueLine(data))
    .attr("stroke", "blue")
    .attr("stroke-width", 2);
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function (d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 1000]);

    let x2 = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([50, 1000]);

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).ticks(25);
    svgContainer.append("g")
      .attr('transform', 'translate(0, 700)')
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .style('font-size', '12px')
      .attr("dx", "-1em")
      .attr("dy", "-.5em")
      .attr("transform", "rotate(-90)")
      .text(d => d);

    // return y value from a row of data
    let yValue = function (d) { return +d[y] }

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 3, limits.yMin - 5]) // give domain buffer
      .range([50, 700]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .attr('class', 'y axis')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale,
      x2: x2
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
