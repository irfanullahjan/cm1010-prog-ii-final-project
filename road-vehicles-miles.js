function RoadVehiclesMiles() {

    // Name for the visualisation to appear in the menu bar.
    this.name = 'Road Vehicles: 1949 to 2018';

    // Each visualisation must have a unique ID with no special
    // characters.
    this.id = 'road-vehicles-miles';

    // Title to display above the plot.
    this.title = 'Road Vehicles: Billion miles travelled in a year';

    // Names for each axis.
    this.xAxisLabel = 'Year';
    this.yAxisLabel = 'Billion Miles';

    var marginSize = 35;

    // Layout object to store all common plot layout parameters and
    // methods.
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
            // Callback function to set the value
            // this.loaded to true.
            function (inputdata) {
                self.loaded = true;
                // Loops to accumulate numbers in columns. Cosecutive columns are added together.
                for (var i = 0; i < inputdata.getRowCount(); i++) {
                    for (var j=0; j < inputdata.getColumnCount(); j++)
                    if (j>1) {
                        inputdata.setNum(i, j, inputdata.getNum(i,j-1)+inputdata.getNum(i,j));
                    }
                }
                return inputdata;
            }
        );
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
        //Cumulatively adds columns to create stacked chart

        // Set min and max years: assumes data is sorted by date.
        this.startYear = this.data.getNum(0, 'Year');
        this.endYear = this.data.getNum(this.data.getRowCount() - 1, 'Year');

        // Find min and max pay gap for mapping to canvas height.
        this.minTraffic = 0;         // Pay equality (zero pay gap).
        this.maxTraffic = max(this.data.getColumn(this.data.getColumnCount()-1));
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
            this.maprafficToHeight.bind(this),
            0);

        // Draw x and y axis.
        drawAxis(this.layout);

        // Draw x and y axis labels.
        drawAxisLabels(this.xAxisLabel,
            this.yAxisLabel,
            this.layout);

        // Plot all pay gaps between startYear and endYear using the width
        // of the canvas minus margins.
        var previous;
        var numYears = this.endYear - this.startYear;

        var fillclr = ['blue', 'green', 'yellow','orange','red'];


        //Draw vertical line at mouseX below x-axis and load data for mouseover year.
        if (mouseX > marginSize * 2 && mouseX < width - marginSize) {
            // Map mouseX to years rounded
            var mouseYear = map(mouseX, marginSize * 2, width - marginSize, this.startYear, this.endYear).toFixed(0);
            var mouseYearRow = this.dataOriginal.findRow(mouseYear, 'Year');
            console.log(mouseYearRow);
            stroke(0);
            line(mouseX, marginSize, mouseX, height - marginSize);
        } else {
            var mouseYear = null;
            var mouseYearRow = null;
        }

        // Data legend
        textAlign(LEFT);
        var legendX = 90;
        var legendY = 20;
        for (var i = 1; i < this.data.getColumnCount(); i++) {
            stroke('black');
            fill(fillclr[i-1]);
            rect(legendX,legendY+25*i,15,15); // colored square
            noStroke();
            fill(0);
            text(this.data.columns[i],legendX+30,legendY+9+25*i); // text label
            if (mouseYear) {
                textAlign(RIGHT);
                text(Math.round(mouseYearRow.arr[i]),legendX+200,legendY+9+25*i); //text value on mouse over
                textAlign(LEFT);
            }
        }

        // Loop over all rows and draw a line from the previous value to
        // the current.
        for (var j = this.data.getColumnCount() - 1; j > 0; j--) {
            previous = null;
            beginShape();
            for (var i = 0; i < this.data.getRowCount(); i++) {
                fill(fillclr[j-1]);
                noStroke();
                // Create an object to store data for the current year.
                var current = {
                    // Convert strings to numbers.
                    'year': this.data.getNum(i, 0),
                    'Traffic': this.data.getNum(i, j)
                };
                vertex(
                    this.mapYearToWidth(current.year),
                    this.maprafficToHeight(current.Traffic)
                );
                if (previous != null) {
                    // Draw line segment connecting previous year to current
                    // year pay gap.


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
                // position of the next line segment.
                previous = current;
            }
            vertex(
                this.mapYearToWidth(this.endYear),
                this.maprafficToHeight(0)
            );
            vertex(
                this.mapYearToWidth(this.startYear),
                this.maprafficToHeight(0)
            );
            endShape();
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

    this.maprafficToHeight = function (value) {
        return map(value,
            this.minTraffic,
            this.maxTraffic,
            this.layout.bottomMargin, // Smaller pay gap at bottom.
            this.layout.topMargin);   // Bigger pay gap at top.
    };
}
