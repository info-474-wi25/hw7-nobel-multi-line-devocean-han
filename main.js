// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {
    // Relevant columns:
    // - fullname -> name (y variable)
    // - year (x variable)
    // - category (color variable)

    // 2.a: REFORMAT DATA
    data.forEach(d => {
        d.year = +d.year;       // Convert year to a number
        d.name = d.fullname;    // Rename column for clarity
    });

    // Check your work:
    // console.log("Raw data:", data);
    // console.log("Years:", data.map(d => d.year));

    // --- STUDENTS START HERE ---
    // 3: PREPARE DATA
    // 3.a: Categorize data into STEM and Non-STEM
    // Example: Group "physics" into STEM, "literature" into Non-STEM
    const stemGroup = ['physics', 'medicine', 'chemistry'];
    const categorizedData = data.map(d => ({
        ...d,   // copy whole object, and add a new key-value pair: "categoryGroup"
        categoryGroup: stemGroup.includes(d.category) ? "STEM" : "Non-STEM"
    }));
    // Code Tip: 화살표 함수에서 { ... }를 소괄호 ()로 감싸야 하는 이유는 객체 리터럴을 반환할 때 중괄호 {}가 함수 블록으로 해석되지 않도록 하기 위함.
    // console.log(categorizedData);

    // 3.b: Group data by categoryGroup and year, and count entries
    // Use d3.rollup to create a nested data structure
    const categories = d3.rollup(categorizedData,
        v => d3.rollup(v, 
            values => values.length, // counts row
            d => d.year
        ),
        d => d.categoryGroup // Group by the new property you just created
    )
    // Code Tip: d3.rollup(data, reduceFunction, groupKeyFunction1, groupKeyFunction2, ...);
    // => Result: outer group by "categoryGroup", inner group by "year", summarization with row count
    // ==> Map(2) {
    //     "STEM" => Map(111) {1901 => 3, ..., 2015 => 7}, 
    //     "Non-STEM" => Map(109) {1901 => 3, ..., 2015 => 2}
    // }
    // Check your work:
    // console.log("Categories:", categories);

    // 4: SET SCALES
    // Set up variables
    const allYears = Array.from(categories.values())
        .flatMap(yearMap => Array.from(yearMap.keys())); // returns full years (total of 220)(1901 ~ 2015 twice)
    const yearCounts = Array.from(categories.values())
        .map(categoryMap => Array.from(categoryMap.values())); // returns all 'count' values (total of 220)
    const maxYCount = d3.max(yearCounts, yearValues => d3.max(yearValues));
    // console.log("allYears: ", yearCounts);
    // console.log("yearCounts: ", yearCounts);
    // console.log("max Y Count: ", maxYCount);

    // 4.a: Define xScale for years using d3.scaleLinear
    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears)) // USe the flat list of years to find min and max
        .range([0, width]);
    // 4.b: Define yScale based on the max count of laureates
    const yScale = d3.scaleLinear()
        .domain([0, maxYCount + 1]) // USe the flat list of years to find min and max
        .range([height, 0]);
    // 4.c: Define colorScale using d3.scaleOrdinal with categories as the domain
    const colorScale = d3.scaleOrdinal()
        .domain(Array.from(categories.keys()))
        .range(d3.schemeCategory10);
    // 4.d: Line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));
    
    // 5: PLOT LINES
    // 5.a: CREATE PATH
    // - Use d3.line() to generate paths from grouped data.
    // - Convert the nested data structure into an array of objects containing x (year) and y (count).
    const dataArray = Array.from(categories.entries()); // outer map -> array
    svgLine.selectAll("path")
        .data(dataArray)
        .enter()
        .append("path")
    // 5.b: PLOT LINE
    // - Bind data to <path> elements and use the "d" attribute to draw lines.
    // - Add a "class" to each line for styling.
        .attr("d", d => {
            const yearMap = d[1];
            const values = Array.from(yearMap.entries())
                .map(([year, count]) => ({ year, count }));
            return line(values);
        })
    // 5.c: ADD STYLE
    // - Use the colorScale to set the "stroke" attribute for each line.
    // - Add stroke-width and optional hover effects.
        .style("stroke", d => colorScale(d[0]))
        .style("fill", "none")
        .style("stroke-width", 2);
    
    // 6: ADD AXES
    // 6.a: X-AXIS
    // - Use d3.axisBottom(xScale) to create the x-axis.
    // - Append it to the bottom of the SVG.
    svgLine.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.format("d")) // Format the x-axis as years 
        ); 
    // 6.b: Y-AXIS
    // - Use d3.axisLeft(yScale) to create the y-axis.
    // - Append it to the left of the SVG.
    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 7: ADD LABELS
    // 7.a: Title
    // - Add a text element above the chart for the chart title.
    svgLine.append("text")
        .text("Nobel Laureates Trends: STEM v.s. Non-STEM")
        .attr("class", "title")
        .attr("x", width / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")

    // 7.b: X-axis label
    // - Add a text element below the x-axis to describe it (e.g., "Year").
    svgLine.append("text")
        .text("Year")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 15)
        .attr("text-anchor", "middle")
    // 7.c: Y-axis label
    // - Add a rotated text element beside the y-axis to describe it (e.g., "Number of Laureates").
    svgLine.append("text")
        .text("Number of Laureates")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 2)
        .attr("x", -height / 2 + 10)
        .attr("text-anchor", "middle")

    // 8: LEGEND
    // 8.a: CREATE AND POSITION SHAPE
    // - Use <g> elements to create groups for each legend item.
    // - Position each legend group horizontally or vertically.
    const legend = svgLine.selectAll(".legend")
        .data(Array.from(categories.entries()))
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(${width - 150}, ${i * 20 - 30})`);
    // 8.b: ADD COLOR SQUARES
    // - Append <rect> elements to the legend groups.
    // - Use colorScale to set the "fill" attribute for each square.
    legend.append("rect")
        .attr("x", 10)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", d => colorScale(d[0])); // Use category name for color
    // 8.c: ADD TEXT
    // - Append <text> elements to the legend groups.
    // - Position and align the text beside each color square.
    legend.append("text")
        .text(d => d[0]) // Use category name as text
        .attr("x", 30)
        .attr("y", 10)
        // .attr("text-anchor", "start")
        // .style("alignment-baseline", "middle");
});
