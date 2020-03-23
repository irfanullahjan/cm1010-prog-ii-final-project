function RoadVehiclesMiles() {

    // Name for the visualisation to appear in the menu bar.
    this.name = 'Road Vehicles: 1949 to 2018';

    // Each visualisation must have a unique ID with no special characters.
    this.id = 'road-vehicles-miles';

    // Title to display above the plot.
    this.title = 'Road Vehicles: Billion miles travelled in a year';

    // Names for each axis.
    this.xAxisLabel = 'Year';
    this.yAxisLabel = 'Billion Miles';

    var marginSize = 35;

    // Layout object to store all common plot layout parameters and methods.
    this.layout = {
        marginSize: marginSize,

        // Locations of margin positions. Left and bottom have double margin
        // size due to axis and tick labels.
        leftMargin: marginSize * 2,
        rightMargin: width - marginSize,
        topMargin: marginSize,
        bottomMargin: height - marginSize * 2,
        pad: 5,

        plotWidth: function () {
            return this.rightMargin - this.leftMargin;
        },

        plotHeight: function () {
            return this.bottomMargin - this.topMargin;
        },

        // Boolean to enable/disable background grid.
        grid: false,

        // Number of axis tick labels to draw so that they are not drawn on
        // top of one another.
        numXTickLabels: 10,
        numYTickLabels: 8,
    };

    // Property to represent whether data has been loaded.
    this.loaded = false;

    // Preload the data. This function is called automatically by the
    // gallery when a visualisation is added.
    this.preload = function () {
        var self = this;
        this.data = loadTable(
            './data/road-vehicles/road-vehicle-miles.csv', 'csv', 'header',
            // Callback function to set the value this.loaded to true.
            function (inputdata) {
                self.loaded = true;
                // Loops to accumulate numbers in columns. Consecutive columns are added together to stack them.
                for (var i = 0; i < inputdata.getRowCount(); i++) {
                    for (var j = 0; j < inputdata.getColumnCount(); j++)
                        if (j > 1) {
                            inputdata.setNum(i, j, inputdata.getNum(i, j - 1) + inputdata.getNum(i, j));
                        }
                }
                return inputdata;
            }
        );

        // Since the above data has been modified for stacked chart, the original values are loaded again into
        // another variable to able to display the value at mouse position.
        this.dataOriginal = loadTable(
            './data/road-vehicles/road-vehicle-miles.csv', 'csv', 'header',
            function (inputdata) {
                return inputdata;
            }
        );
    };

    this.setup = function () {
        // Font defaults.
        textSize(16);

        // Set min and max years: assumes data is sorted by date.
        this.startYear = this.data.getNum(0, 'Year');
        this.endYear = this.data.getNum(this.data.getRowCount() - 1, 'Year');

        // Find min and max traffic for mapping to canvas height.
        this.minTraffic = 0;
        this.maxTraffic = max(this.data.getColumn(this.data.getColumnCount() - 1));
    };

    this.destroy = function () {
    };

    this.draw = function () {
        if (!this.loaded) {
            console.log('Data not yet loaded');
            return;
        }

        // Draw the title above the plot.
        this.drawTitle();

        // Draw all y-axis labels.
        drawYAxisTickLabels(this.minTraffic,
            this.maxTraffic,
            this.layout,
            this.mapTrafficToHeight.bind(this),
            0);

        // Draw x and y axis.
        drawAxis(this.layout);

        // Draw x and y axis labels.
        drawAxisLabels(this.xAxisLabel,
            this.yAxisLabel,
            this.layout);

        // Plot all traffic values between startYear and endYear using the width
        // of the canvas minus margins.
        var previous;
        var numYears = this.endYear - this.startYear;

        var fillColour = ['blue', 'green', 'yellow', 'orange', 'red'];


        // Loop over all rows and for each row, draw a shape between that the line for
        // that row and x-axis to fill it with colour.
        for (var j = this.data.getColumnCount() - 1; j > 0; j--) {

            // Need to reset previous for each row of data.
            previous = null;

            // Shape between line and x-axis to be filled with color
            beginShape();
            for (var i = 0; i < this.data.getRowCount(); i++) {
                fill(fillColour[j - 1]);
                noStroke();
                // Create an object to store data for the current year.
                var current = {
                    // Convert strings to numbers.
                    'year': this.data.getNum(i, 0),
                    'Traffic': this.data.getNum(i, j)
                };
                vertex(
                    this.mapYearToWidth(current.year),
                    this.mapTrafficToHeight(current.Traffic)
                );
                if (previous != null) {

                    // The number of x-axis labels to skip so that only
                    // numXTickLabels are drawn.
                    var xLabelSkip = ceil(numYears / this.layout.numXTickLabels);

                    // Draw the tick label marking the start of the previous year.
                    if (i % xLabelSkip == 0) {
                        drawXAxisTickLabel(previous.year, this.layout,
                            this.mapYearToWidth.bind(this));
                    }
                }

                // Assign current year to previous year so that it is available
                // during the next iteration of this loop to give us the start
                // position of the next vertex in the shape.
                previous = current;
            }

            //Final two vertexes in the shape to be able to fill the area below line with color
            vertex(
                this.mapYearToWidth(this.endYear),
                this.mapTrafficToHeight(0)
            );
            vertex(
                this.mapYearToWidth(this.startYear),
                this.mapTrafficToHeight(0)
            );
            endShape();
        }

        //Show legend, load original and modified data for mouseover year then display it along with legend and show a line on graph
        if (mouseX > this.layout.leftMargin && mouseX < this.layout.rightMargin) {
            // Map mouseX to years rounded
            var mouseYear = map(mouseX, this.layout.leftMargin, this.layout.rightMargin, this.startYear, this.endYear).toFixed(0);
            var mouseYearOrigData = this.dataOriginal.findRow(mouseYear, 'Year');
            var mouseYearModiData = this.data.findRow(mouseYear, 'Year');
            stroke(0);
            line(
                this.mapYearToWidth(mouseYear),
                this.mapTrafficToHeight(mouseYearModiData.arr[5]),
                this.mapYearToWidth(mouseYear),
                this.mapTrafficToHeight(0),
            );
            noStroke();
            fill(255);
            ellipse(
                this.mapYearToWidth(mouseYear),
                this.mapTrafficToHeight(15),
                50,
                30
            );
            textAlign(CENTER);
            fill(0);
            text(
                mouseYear,
                this.mapYearToWidth(mouseYear),
                this.mapTrafficToHeight(15),
            )
        } else {
            var mouseYear = null;
            var mouseYearOrigData = null;
        }
        textAlign(LEFT);
        var legendX = 90;
        var legendY = 20;
        for (var i = 1; i < this.data.getColumnCount(); i++) {
            stroke('black');
            fill(fillColour[i - 1]);
            rect(legendX, legendY + 25 * i, 15, 15); // colored square
            noStroke();
            fill(0);
            text(this.data.columns[i], legendX + 30, legendY + 9 + 25 * i); // text label
            if (mouseYear) {
                textAlign(RIGHT);
                text(Math.round(mouseYearOrigData.arr[i]), legendX + 200, legendY + 9 + 25 * i); //text value on mouse over
                text(Math.round(100 * mouseYearOrigData.arr[i] / mouseYearModiData.arr[5]) + '%', legendX + 250, legendY + 9 + 25 * i); //text value on mouse over
                textAlign(LEFT);

            }
        }
        // total traffic at mouse position
        if (mouseYear) {
            textStyle(BOLD);
            textAlign(RIGHT);
            text(Math.round(mouseYearModiData.arr[5]), legendX + 200, legendY + 9 + 150); //text value on mouse over
            textAlign(LEFT);
            text('Total traffic', legendX + 30, legendY + 9 + 150); //text value on mouse over
            textStyle(NORMAL);
        }
    };

    this.drawTitle = function () {
        fill(0);
        noStroke();
        textAlign('center', 'center');

        text(this.title,
            (this.layout.plotWidth() / 2) + this.layout.leftMargin,
            this.layout.topMargin - (this.layout.marginSize / 2));
    };

    this.mapYearToWidth = function (value) {
        return map(value,
            this.startYear,
            this.endYear,
            this.layout.leftMargin,   // Draw left-to-right from margin.
            this.layout.rightMargin);
    };

    this.mapTrafficToHeight = function (value) {
        return map(value,
            this.minTraffic,
            this.maxTraffic,
            this.layout.bottomMargin, // Smaller traffic at bottom.
            this.layout.topMargin);   // Bigger traffic at top.
    };
}
