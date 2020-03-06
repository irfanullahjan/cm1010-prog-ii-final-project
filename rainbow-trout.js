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

        // Set min and max years: assumes data is sorted by date.
        this.startYear = this.data.getNum(0, 'length');
        this.endYear = this.data.getNum(this.data.getRowCount() - 1, 'length');

        // Find min and max pay gap for mapping to canvas height.
        this.minPayGap = 0;         // Pay equality (zero pay gap).
        this.maxPayGap = max(this.data.getColumn('weight'));

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
        drawYAxisTickLabels(this.minPayGap,
            this.maxPayGap,
            this.layout,
            this.mapPayGapToHeight.bind(this),
            0);

        for (var i = this.startYear; i <= this.endYear; i++) {
            if (i % this.layout.numXTickLabels == 0) {
                drawXAxisTickLabel(i, this.layout,
                    this.mapYearToWidth.bind(this));
            }

        }    

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

        // Loop over all rows and draw a line from the previous value to
        // the current.
        for (var i = 0; i < this.data.getRowCount(); i++) {

            // Create an object to store data for the current year.
            var current = {
                // Convert strings to numbers.
                'year': this.data.getNum(i, 'length'),
                'payGap': this.data.getNum(i, 'weight')
            };

            stroke(0);
            ellipse(this.mapYearToWidth(current.year),this.mapPayGapToHeight(current.payGap),5);
        }
        line(
            this.mapYearToWidth(this.startYear),
            this.mapPayGapToHeight(this.linearFit.a + this.linearFit.b * this.startYear),
            this.mapYearToWidth(this.endYear),
            this.mapPayGapToHeight(this.linearFit.a + this.linearFit.b * this.endYear),
            );

        stroke(0);
        noFill();
        beginShape();
        for (var i = this.startYear; i < this.endYear; i++) {
            vertex(
                this.mapYearToWidth(i),
                this.mapPayGapToHeight(this.exponentialFit.a*Math.pow(Math.E,this.exponentialFit.b*i))
            );
        }
        endShape();
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
            this.startYear - 10,
            this.endYear + 10,
            this.layout.leftMargin,   // Draw left-to-right from margin.
            this.layout.rightMargin);
    };

    this.mapPayGapToHeight = function (value) {
        return map(value,
            this.minPayGap,
            this.maxPayGap + 100,
            this.layout.bottomMargin, // Smaller pay gap at bottom.
            this.layout.topMargin);   // Bigger pay gap at top.
    };

    // Liner least squares regression
    this.linearReg = function() {
        var n = this.data.getRowCount();
        var sumX = 0;
        var sumY = 0;
        var sumXY = 0;
        var sumX2 = 0;
        for (var i = 0; i < n; i++) {
            sumXY += this.data.getNum(i, 'length') * this.data.getNum(i, 'weight');
            sumX2 += this.data.getNum(i, 'length') * this.data.getNum(i, 'length');
            sumX += this.data.getNum(i, 'length');
            sumY += this.data.getNum(i, 'weight');
        }
        var a, b;
        b = ( n*sumXY - sumX * sumY ) / ( n*sumX2 - sumX*sumX );
        a = ( sumY - b * sumX ) / n;
        return {'a': a,'b': b};
    }

    // Exponential least squares regression
    this.exponentialReg = function() {
        var sum_x2 = 0, sum_lny = 0, sum_x = 0, sum_xlny = 0, n = this.data.getRowCount();
        for(var i = 0; i < n; i++){
          var x = this.data.getNum(i, 'length');
          var y = this.data.getNum(i, 'weight');
          sum_x2 += x*x, sum_lny += Math.log(y), sum_x += x, sum_xlny += x*Math.log(y);
        }
        var a = ((sum_lny*sum_x2)-(sum_x*sum_xlny))/((n*sum_x2)-sum_x*sum_x);
        var b = ((n*sum_xlny)-(sum_x*sum_lny))/((n*sum_x2)-sum_x*sum_x);
        return {'a': Math.exp(a),'b': b};
    }
}
