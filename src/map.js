import * as d3 from 'd3'
import {landGrid} from './landGrid'
import gridMap from './gridMap.csv'
import fat from './fat.csv'

function drawMap() {
    console.log("draw map")
    const w = 572, h = 651
//scales
    const rowscale = d3.scaleLinear()
        .domain([0, 26])
        .range([0, h])

    const colscale = d3.scaleLinear()
        .domain([0, 22])
        .range([0, w])

    const circleScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, colscale(1)])

    const wghtScale = d3.scaleLinear()
        .domain([10, 100])
        .range([30, 800])

    const wdthScale = d3.scaleLinear()
        .domain([0, 100])
        .range([100, 100])

    let focus;

    function drawCountryes(countryData) {

        //Set up SVG
        const svg = d3.select("#root").append("svg")
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "black");

        const mapmask = svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", w)
            .attr("height", h)
            .attr("fill", "#C1EDFF");

        const gridland = svg.selectAll("polygon.land")
            .data(landGrid)
            .enter()
            .append("polygon")
            .attr("class", "land")
            .attr("fill", "white")
            .attr("stroke", "#C1EDFF")
            .attr("stroke-width", "0.5px")
            .attr("points", d => {
                return [0, 0, colscale(1), 0, colscale(1), rowscale(1), 0, rowscale(1)]
            })
            .attr("transform", d => {
                return "translate(" +
                    [colscale(d.Y - 1), rowscale(d.X - 1)] + ")"
            });


// COUNTRY label boxes
        const labelboxes = svg.selectAll("rect.boxes").data(countryData).enter().append("rect")
            .attr("fill", "white")
            .attr("class", "boxes")
            .attr("width", colscale(1))
            .attr("height", rowscale(1))
            .attr("x", d => {
                return colscale(d.Col - 1);
            })
            .attr("y", d => {
                return rowscale(d.Row - 1);
            });

        // COUNTRY Labels
        const labels = svg.selectAll("text.label")
            .data(countryData)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .attr("x", d => {
                if (d) return colscale(+d.Col - 0.5)
            })
            .attr("y", d => {
                if (d) return rowscale(+d.Row - 0.35);
            })
            .text(d => d.CountryCode)
            .style("font-variation-settings", d => `"wght" ${wghtScale(d['2016sexes'])}, "wdth" ${wdthScale(d['2016sexes'])}`)
            .style("pointer-events", "none");

        labelboxes.on("mouseover", function (d) {
            focus = d.CountryCode
            // get THIS box's x and y values
            var xPos = parseFloat(d3.select(this).attr("x")) + 20;
            var yPos = parseFloat(d3.select(this).attr("y")) + 20;
            //console.log(yPos)
            // update tooltip
            d3.select("#tooltip")
                .style("left", xPos + "px")
                .style("top", yPos + "px")
            d3.select("#tooltip .name").text(d.ShortName)
            d3.select("#tooltip #value").text(d3.format(",.2f")(Math.abs(+d['2016sexes']))+"%")
            d3.select("#tooltip .year").text(" в 2000");

            d3.select("#tooltip").classed("hidden", false);
        });
        labelboxes.on("mouseout", function () {
            d3.select(this).style("fill", "white");
            d3.select("#tooltip").classed("hidden", true);
        });

    }
    let i
    const victimsData = []

    d3.csv(gridMap).then(data => {
        d3.csv(fat).then(fatData => {



            for (i = 0; i <= data.length; i++) {
                if (data[i]) {
                    const object = fatData.find(e=>e.Country==data[i].Country)
                    for (var property in object) {
                        if (object.hasOwnProperty(property)) {
                            const attrArray = property.match(/^\d+|\w+$/g),
                                year = attrArray[0],
                                sex = attrArray[1]
                            if (object)  data[i][year+sex]=+object[property].match(/\d+.\d+/)
                            else {
                                data[i].value=0
                                data[i].nodata=true
                            }
                        }
                    }

                    victimsData.push(data[i])
                }
            }
            //console.log(victimsData)
            drawCountryes(victimsData)

            let ix = 1976
            const delay=200
            let timer
            resetTimer()

            function resetTimer(){
                timer =setInterval(timerTick, delay);
            }

            const playButton = d3.select("svg").append("text").attr("class","playbutton").text("❚❚").attr("x",w-rowscale(0.9)).attr("y",colscale(0.75)).attr("fill","black");

            function timerTick() {

                const check=checkButton()

                if (check=="stop") {
                    clearInterval(timer);
                }
                if (ix <= 2016 && check=="resume"){
                    updateData(ix)
                    ix++
                }
                if (ix > 2016 && check=="resume") {
                    ix = 1976
                    //timer.stop()
                    clearInterval(timer);
                    resetTimer()
                }
                if (ix >= 2016 && check=="stop") {
                    ix = 1976
                    clearInterval(timer);
                }
            }

            function checkButton(){

                playButton
                    .on("click", function() {
                        const button = d3.select(this)

                        if (button.text() === "▶") {
                            //if (ix==0) {ix=0; timer.stop()}
                            if (ix > 2016) {
                                ix = 0
                                clearInterval(timer);
                                resetTimer()
                            }
                            else resetTimer();

                            button.text("❚❚")
                                .classed("paused",false);

                        } else {

                            clearInterval(timer);
                            button
                                .text("▶")
                                .classed("paused",true);
                        }
                    })
                let result = (playButton.text()=="▶") ? "stop" : "resume"
                return result
            }

            function updateData(year) {
                const countryData = victimsData
                console.log ("update data",year)


                const labels = d3.select("svg").selectAll("text.label")
                    .data(countryData)

                labels
                    .classed("circlesInterpolate", d => {
                        if (+d[year+"sexes"] < 0) return true
                        else return false
                    })

                    //.style("font-variation-settings", d => `"wght" ${wghtScale(d['2016sexes'])}, "wdth" ${wdthScale(d['2016sexes'])}`)

                    .style("font-variation-settings",(d) => {
                        if (!focus) focus = "RUS"
                        let elem = countryData.find(el => el.CountryCode == focus)

                        d3.select("#tooltip #value")
                            .text(d3.format(",.4f")(+elem[year+"sexes"]) + "%")

                        d3.select("#tooltip .year").text(" в " + year);

                        return `'wght' ${wghtScale(d[year+'sexes'])}`
                    })



                /*const labelboxes = d3.select("svg").selectAll("rect.boxes")

                labelboxes.on("mouseover", function (d) {
                    focus = d.CountryCode
                    // get THIS box's x and y values
                    var xPos = parseFloat(d3.select(this).attr("x")) + 20;
                    var yPos = parseFloat(d3.select(this).attr("y")) + 130;
                    // update tooltip
                    d3.select("#tooltip")
                        .style("left", xPos + "px")
                        .style("top", yPos + "px")

                    d3.select("#tooltip .name").text(d.ShortName + ": ")
                    d3.select("#tooltip #value").text(d3.format(",.4f")(Math.abs(+d['20'+year])/1000)+"%")
                    d3.select("#tooltip").classed("hidden", false);
                });
                labelboxes.on("mouseout", function () {
                    //d3.select("#tooltip #value").text("")
                    d3.select("#tooltip").classed("hidden", true);
                });*/

            }



        })
    })

    }

export {drawMap}