function TechDiversityRace() {

    // Name for the visualisation to appear in the menu bar.
    this.name = 'Tech Diversity: Race';

    // Each visualisation must have a unique ID with no special
    // characters.
    this.id = 'tech-diversity-race';

    // Property to represent whether data has been loaded.
    this.loaded = false;

    // Values in this array are incremented smoothly to created animation effect.
    // Initial values are given so the chart animates on load.
    this.currentState = [60, 60, 60, 60, 60, 60];
    // Values by which to increment currentState each frame in order to reach targetState
    this.incrementArr = [0, 0, 0, 0, 0, 0];

    // Preload the data. This function is called automatically by the
    // gallery when a visualisation is added.
    this.preload = function () {
        var self = this;
        this.data = loadTable(
            './data/tech-diversity/race-2018.csv', 'csv', 'header',
            // Callback function to set the value
            // this.loaded to true.
            function (table) {
                self.loaded = true;
            });
    };

    this.setup = function () {
        if (!this.loaded) {
            console.log('Data not yet loaded');
            return;
        }

        // Create a select DOM element.
        this.select = createSelect();
        this.select.position(350, 40);

        // Fill the options with all company names.
        var companies = this.data.columns;
        // First entry is empty.
        for (let i = 1; i < companies.length; i++) {
            this.select.option(companies[i]);
        }
    };

    this.destroy = function () {
        this.select.remove();
        this.currentState = [60, 60, 60, 60, 60, 60];
        // Resets pie to equal sections so it animates on start.
    };

    // Create a new pie chart object.
    this.pie = new PieChart(width / 2, height / 2, width * 0.4);

    this.draw = function () {
        if (!this.loaded) {
            console.log('Data not yet loaded');
            return;
        }

        // Get the value of the company we're interested in from the
        // select item.
        var companyName = this.select.value();

        // Get the column of raw data for companyName.
        var targetState = this.data.getColumn(companyName);

        // Convert all data strings to numbers.
        targetState = stringsToNumbers(targetState);

        for (var i = 0; i < this.currentState.length; i++) {
            this.incrementArr[i] = (targetState[i] - this.currentState[i]) / 15;       // averages the animation over the next 15 frames. actually takes much longer than 15 frames to reach target
            this.currentState[i] = this.currentState[i] + this.incrementArr[i];        // Increment values in currentState by values in incrementsArr
        }

        // Copy the row labels from the table (the first item of each row).
        var labels = this.data.getColumn(0);

        // Colour to use for each category.
        var colours = ['blue', 'red', 'green', 'pink', 'purple', 'yellow'];

        // Make a title.
        var title = 'Employee diversity at ' + companyName;

        // Draw the pie chart!
        this.pie.draw(this.currentState, labels, colours, title);
    };
}
