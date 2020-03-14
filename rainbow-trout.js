function RainbowTrout() {

    // Name for the visualisation to appear in the menu bar.
    this.name = 'Rainbow Trout: Length vs Weight';

    // Each visualisation must have a unique ID with no special
    // characters.
    this.id = 'rainbow-trout';

    // Title to display above the plot.
    this.title = 'Rainbow Trout: Length vs Weight';

    // Names for each axis.
    this.xAxisLabel = 'Length (mm)';
    this.yAxisLabel = 'Weight (g)';

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
        grid: true,

        // Number of axis tick labels to draw so that they are not drawn on
        // top of one another.
        numXTickLabels: 25,
        numYTickLabels: 6,
    };

    // Property to represent whether data has been loaded.
    this.loaded = false;

    // Preload the data. This function is called automatically by the
    // gallery when a visualisation is added.
    this.preload = function () {
        var self = this;
        this.data = loadTable(
            './data/rainbow-trout/rainbow-trout.csv', 'csv', 'header',
            // Callback function to set the value
            // this.loaded to true.
            function (table) {
                self.loaded = true;
            });
    };

    this.setup = function () {
        // Font defaults.
        textSize(16);

        // Set min and max lengths: assumes data is sorted by date.
        this.startLength = this.data.getNum(0, 'length');
        this.endLength = this.data.getNum(this.data.getRowCount() - 1, 'length');

        // Find min and max weight for mapping to canvas height.
        this.minWeight = 0;
        this.maxWeight = max(this.data.getColumn('weight'));

        this.linearFit = this.linearReg();
        this.exponentialFit = this.exponentialReg();
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
        drawYAxisTickLabels(this.minWeight,
            this.maxWeight,
            this.layout,
            this.mapWeightToHeight.bind(this),
            0);

        for (var i = this.startLength; i <= this.endLength; i++) {
            if (i % this.layout.numXTickLabels == 0) {
                drawXAxisTickLabel(i, this.layout,
                    this.mapLengthToWidth.bind(this));
            }

        }

        // Draw x and y axis.
        drawAxis(this.layout);

        // Draw x and y axis labels.
        drawAxisLabels(this.xAxisLabel,
            this.yAxisLabel,
            this.layout);

        // Plot all weights between startLength and endLength using the width
        // of the canvas minus margins.
        var previous;

        // Loop over all rows and draw a line from the previous value to
        // the current.
        for (var i = 0; i < this.data.getRowCount(); i++) {

            // Create an object to store data for the current length.
            var current = {
                // Convert strings to numbers.
                'length': this.data.getNum(i, 'length'),
                'weight': this.data.getNum(i, 'weight')
            };

            noStroke();
            fill(0);
            ellipse(this.mapLengthToWidth(current.length), this.mapWeightToHeight(current.weight), 4);
        }
        stroke(200, 0, 0);
        line(
            this.mapLengthToWidth(this.startLength),
            this.mapWeightToHeight(this.linearFit.a + this.linearFit.b * this.startLength),
            this.mapLengthToWidth(this.endLength),
            this.mapWeightToHeight(this.linearFit.a + this.linearFit.b * this.endLength),
        );

        stroke(0, 150, 0);
        noFill();
        beginShape();
        for (var i = this.startLength; i < this.endLength; i++) {
            // if value of function exceeds max weight, we stop drop drawing the curve further
            if (this.exponentialFit.a * Math.pow(Math.E, this.exponentialFit.b * i) < max(this.data.getColumn('weight'))) {
                vertex(
                    this.mapLengthToWidth(i),
                    this.mapWeightToHeight(this.exponentialFit.a * Math.pow(Math.E, this.exponentialFit.b * i))
                );
            }
        }
        endShape();


        // Show dots on curves at mouseX and show values
        if (mouseX >= this.layout.leftMargin && mouseX < this.layout.rightMargin) { //only needed when mouseX is within the graph
            var mouseLength = map(mouseX, this.layout.leftMargin, this.layout.rightMargin, this.startLength, this.endLength);
            var exponentialMouseWeight = this.exponentialFit.a * Math.exp(this.exponentialFit.b * mouseLength);
            var linearMouseWeight = this.linearFit.a + this.linearFit.b * mouseLength;

            // dots on curves
            noStroke();
            fill(0, 150, 0);
            // if statement to limit exponential curve to graph when value exceeds the max weight
            if (this.exponentialFit.a * Math.exp(this.exponentialFit.b * mouseLength) < max(this.data.getColumn('weight'))) {
                ellipse(mouseX, this.mapWeightToHeight(exponentialMouseWeight), 6);
            }
            fill(200, 0, 0);
            ellipse(mouseX, this.mapWeightToHeight(linearMouseWeight), 6);

            // values in upper left corner
            fill(230);
            rect(this.layout.leftMargin + 20, this.layout.marginSize + 20, 165, 60);
            fill(0);
            textAlign(LEFT);
            text('Exponential',this.layout.leftMargin + 30,this.layout.marginSize+40);
            text('Linear',this.layout.leftMargin + 30,this.layout.marginSize+65);
            textAlign(RIGHT);
            fill(0, 150, 0);
            text(exponentialMouseWeight.toFixed(1), this.layout.leftMargin + 175, this.layout.marginSize + 40);
            fill(200, 0, 0);
            text(linearMouseWeight.toFixed(1), this.layout.leftMargin + 175, this.layout.marginSize + 65);
        } else {
            mouseLength = null;
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

    this.mapLengthToWidth = function (value) {
        return map(value,
            this.startLength,
            this.endLength,
            this.layout.leftMargin,   // Draw left-to-right from margin.
            this.layout.rightMargin);
    };

    this.mapWeightToHeight = function (value) {
        return map(value,
            this.minWeight,
            this.maxWeight,
            this.layout.bottomMargin, // Less weight at bottom.
            this.layout.topMargin);   // More weight at top.
    };

    // Liner least squares regression
    this.linearReg = function () {
        var n = this.data.getRowCount();
        var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (var i = 0; i < n; i++) {
            var x = this.data.getNum(i, 'length');
            var y = this.data.getNum(i, 'weight');
            sumXY += x * y;
            sumX2 += x * x;
            sumX += x;
            sumY += y;
        }
        var a, b;
        b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        a = (sumY - b * sumX) / n;
        return { 'a': a, 'b': b };
    }

    // Exponential least squares regression
    // Adopted from https://stackoverflow.com/questions/34951671/js-exponential-curve-fit
    this.exponentialReg = function () {
        var sumX2 = 0, sumlnY = 0, sumX = 0, sumXlnY = 0, n = this.data.getRowCount();
        for (var i = 0; i < n; i++) {
            var x = this.data.getNum(i, 'length');
            var y = this.data.getNum(i, 'weight');
            sumX2 += x * x;
            sumlnY += Math.log(y);
            sumX += x;
            sumXlnY += x * Math.log(y);
        }
        var a = ((sumlnY * sumX2) - (sumX * sumXlnY)) / ((n * sumX2) - sumX * sumX);
        var b = ((n * sumXlnY) - (sumX * sumlnY)) / ((n * sumX2) - sumX * sumX);
        return { 'a': Math.exp(a), 'b': b };
    }
}
