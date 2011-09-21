/*
pentaho.VizController

A controller for visualization objects

author: James Dixon

*/

var pentaho = pentaho || {};

/*
    A list of color palettes that can be used by visualizations
*/
pentaho.palettes = [];

pentaho.palettes.push( {
    name: 'palette 1',
    colors: [
		"#336699",
		"#99CCFF",
		"#999933",
		"#666699",
		"#CC9933",
		"#006666",
		"#3399FF",
		"#993300",
		"#CCCC99",
		"#666666",
		"#FFCC66",
		"#6699CC",
		"#663366"]
    }
);
        
pentaho.palettes.push( {
    name: 'palette 2',
    colors: [
      "#880a0f",
      "#b09a6b",
      "#772200",
      "#c52f0d",
      "#123d82",
      "#4a0866",
      "#ffaa00",
      "#1e8ad3",
      "#aa6611",
      "#772200",
      "#8b2834",
      "#333333"]
    }
);
      
pentaho.palettes.push( {
    name: 'palette 3',
    colors: [
        "#387179",
		"#626638",
		"#A8979A",
		"#B09A6B",
		"#772200",
		"#C52F0D",
		"#123D82",
		"#4A0866",
		"#445500",
		"#FFAA00",
		"#1E8AD3",
		"#AA6611",
		"#772200"]
    }
);

/*
    pentaho.visualizations is an array that visualization metadata objects can be added to
*/
pentaho.visualizations = pentaho.visualizations || [];

var visualizations = pentaho.visualizations;

/*
    pentaho.VizController
    The visualization controller
*/
pentaho.VizController = function(id) {
    this.id = id;
    this.domNode = null;
    this.isDragging = false;
    this.combinations = [];
    this.selections = [];
    this.highlights = [];
    this.metrics = null;
    this.origTable = null;
    this.dataTable = null;
    this.currentViz = null;
    this.currentAction = 'select';
    this.layoutPanelElement = null;
    this.layoutPanel = null;
    this.visualPanelElement = null;
    this.layoutShown = false;
    this.toolbarElement = null;
    this.title = null;
    this.chart = null;
    this.palette = pentaho.palettes[0];
    this.lastError = null;
}

/*
    getError
    Returns the most recent Javascript error object
*/
pentaho.VizController.prototype.getError = function() {
    return this.lastError;
}

/*
    getState
    Returns the state of the controller and the current visualiztion.
    {
        vizId: 'some id', // the id of the visualization
        vizState: {} // the state object from the visualization
    }
*/
pentaho.VizController.prototype.getState = function() {
    try {
        var state = {};
        
        if( this.currentViz ) {
            state.vizId = this.currentViz.id;
            if( this.currentViz.getState ) {
                state.vizState = this.currentViz.getState();
            }
        }
        return state;
    } catch (e) {
        this.lastError = e;
        return null;
    }
}

/*
    setState
    Sets the state of the controller and the visualization

    state       A state object
    returns     true if there were no errors
*/
pentaho.VizController.prototype.setState = function(state) {
    try {
        // find the visualization
        for( var idx=0; idx<pentaho.visualizations.length; idx++) {
            if( pentaho.visualizations[idx].id == state.vizId) {
                // we found a visualization with the specified id
                this.currentViz = pentaho.visualizations[idx];
                break;
            }
        }
        if( !this.currentViz ) {
            alert('Visualization not found: '+state.vizId);
        }
        // set the state of the visualization
        if( this.currentViz.setState ) {
            this.currentViz.setState( state.vizState );
        }
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    setDomNode
    Sets the HTML DOM node that the visualization needs to render inside
    
    node    HTML DOM element
    returns     true if there were no errors
*/
pentaho.VizController.prototype.setDomNode = function( node ) {
    try {
        this.domNode = node;
        
        // Empty out the node
        while(node.firstChild) {
            node.removeChild(node.firstChild);
        }

        // Create an empty DIV for the visualization to render in
        var width = this.domNode.offsetWidth;
        var height = this.domNode.offsetHeight;
        this.visualPanelElement = document.createElement("DIV");
        this.visualPanelElement.setAttribute('id', 'visualPanelElement-'+this.id);
        this.visualPanelElement.setAttribute('style','border:0px solid #red; background-color: white; width: '+(width)+'px; height: '+(height)+'px');
        this.domNode.appendChild(this.visualPanelElement);
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    setDataTable
    Sets the DataTable (pentaho.DataTable) for the visualization 

    table       A DataTable object
    returns     true if there were no errors
*/
pentaho.VizController.prototype.setDataTable = function(table) {
    try {
        this.origTable = table;
        this.setupTable();
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    setTitle
    Sets the title that the visualization should display
    
    title   The title to display
*/
pentaho.VizController.prototype.setTitle = function(title) {
    this.title = title;
}

/*
    setVisualization
    Sets the visualization to display
    
    visualization   Visualization metadata
    returns         true if there were no errors
*/
pentaho.VizController.prototype.setVisualization = function(visualization) {
    try {
        if( this.currentViz && this.currentViz.class != visualization.class ) {
            // remove the old visualization
            this.setDomNode(this.domNode);
        }

        // dipslay the new visualization
        this.doVisualization(visualization, false);
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    updateVisualization
    Updates the current visualization, for example if the data has changed in some way

    returns         true if there were no errors
*/
pentaho.VizController.prototype.updateVisualization = function() {
    try {
        // update the current visualization, if possible
        if(!this.currentViz) {
            return;
        }
        this.doVisualization(this.currentViz, false);
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    doVisualization
    Creates a visualization and causes it to render
    
    returns         true if there were no errors
*/
pentaho.VizController.prototype.doVisualization = function( visualization, vizDataOptChanged ) {

    try {
        currentView = new pentaho.DataView(this.dataTable);

        var className = visualization.class;

        // Set chart options
        var options = {'title':this.title,
                     'width':this.visualPanelElement.offsetWidth,
                     'height':this.visualPanelElement.offsetHeight,
//                     'columnDataReqIds':columnDataReqIds,
                     metrics: this.metrics,
                     palette: this.palette,
                     controller: this,
                     action: this.currentaction};

        if( visualization.needsColorGradient ) {
            var gradMap = [ [255,0,0],[255,255,0],[0,0,255],[0,255,0] ];
//            var idx = document.getElementById('colorGradient1Select').selectedIndex;
            options.color1 = gradMap[0];
//            idx = document.getElementById('colorGradient2Select').selectedIndex;
            options.color2 = gradMap[3];
        }

                     
        // see if we have additional properties to set
        var propMap = visualization.propMap;
        if(propMap) {
            for(var propNo=0; propNo<propMap.length; propNo++) {
                var prop = propMap[propNo];
                var propValue = null;
                if( prop.source == 'columnlabel') {
                    propValue = currentView.getColumnLabel(prop.position);
                }
                if( prop.source == 'maxvalue') {
                    propValue = this.metrics[prop.position].range.max;
                }
                if( prop.source == 'minvalue') {
                    propValue = this.metrics[prop.position].range.min;
                }
                var obj = options;
                for( var nameNo=0; nameNo<prop.name.length; nameNo++) {
                    if(nameNo < prop.name.length-1) {
                        // make sure the parent parts exist
                        if( !obj[prop.name[nameNo]] ) {
                            obj[prop.name[nameNo]] = {};
                        }
                        obj = obj[prop.name[nameNo]]
                    }
                    else {
                        // we are at the end
                        obj[prop.name[nameNo]] = propValue;
                    }
                }
            }
        }
                     
        if(visualization.args) {
            for(x in visualization.args) {
                options[x] = visualization.args[x];
            }
        }

        var id = 'chart_div'+this.id;
                     
        var chartDiv = this.visualPanelElement;
        eval( 'this.chart = new '+className+'(chartDiv)');
        // Instantiate and draw our chart, passing in some options.

        var myself = this;
        this.chart.controller = this;
        this.chart.id = 'viz'+this.id;
        
        pentaho.events.addListener(this.chart, 'select', function(){ return myself.chartSelectHandler.apply(myself,arguments||[]);} );
        pentaho.events.addListener(this.chart, 'onmouseover', function(){ return myself.chartMouseOverHandler.apply(myself,arguments||[]);} );
        pentaho.events.addListener(this.chart, 'onmouseout', function(){ return myself.chartMouseOutHandler.apply(myself,arguments||[]);} );

        if( !currentView ) {
            alert('No suitable dataset');
            document.getElementById('chart_div').innerHTML = '';
            return;            
        }
        
        this.chart.setHighlights(this.highlights);
        
        try {
            this.chart.draw(currentView, options);
        } catch (e) {
            alert(e)
        }
        this.currentViz = visualization;
        return true;
    } catch (e) {
        this.lastError = e;
        return false;
    }
}

/*
    chartSelectHandler
    Called when the user clicks on something in the visualization
*/
pentaho.VizController.prototype.chartSelectHandler = function(args) {

    for (var i = 0; i < args.selections.length; i++) {
        var selectedItem = args.selections[i];
        
        var rowItem;
        var colId;
        var colLabel;
        var value;
        
        if(selectedItem.rowItem) {
            rowItem = selectedItem.rowItem;
            rowId = selectedItem.rowId;
            rowLabel = selectedItem.rowLabel;
        }
        if(selectedItem.column || selectedItem.column == 0) {
            colId = selectedItem.columnId;
            colLabel = selectedItem.columnLabel;
        }
        if((selectedItem.row || selectedItem.row == 0) && selectedItem.column) {
            value = selectedItem.value;
        }
      //  alert(rowItem+','+colLabel+'='+value);
      
        // see if this is already highlighted
        var removed = false;
        var modified = false;
        for( var hNo=0; hNo<this.highlights.length; hNo++) {
            if( this.highlights[hNo].rowItem && this.highlights[hNo].rowItem == rowItem && this.highlights[hNo].colId && this.highlights[hNo].colId == colId && this.highlights[hNo].type == 'column' && selectedItem.type == 'cell') {
                // switch this
                this.highlights[hNo].type = 'row';
                highlight.id = selectedItem.rowId;
                highlight.value = rowItem;
                modified = true;
                break;
            }
            else if( this.highlights[hNo].rowItem && this.highlights[hNo].rowItem == rowItem && this.highlights[hNo].colId && this.highlights[hNo].colId == colId && this.highlights[hNo].type == 'column') {
                // remove this
                this.highlights.splice( hNo, 1 );
                removed = true;
                break;
            }
            else if( this.highlights[hNo].rowItem && this.highlights[hNo].rowItem == rowItem) {
                // remove this
                this.highlights.splice( hNo, 1 );
                removed = true;
                break;
            }
        }
        if(!removed && !modified) {
            highlight = { rowItem: rowItem, colId: colId, colLabel: colLabel, rowId: rowId, rowLabel: rowLabel };
            highlight.type = selectedItem.type;
            if( selectedItem.type == 'row' ) {
                highlight.id = rowId;
                highlight.value = rowItem;
            }
            else if( selectedItem.type == 'column' ) {
                highlight.type = 'column';
                highlight.id = colId;
                highlight.value = colLabel;
            }
            else if( selectedItem.type == 'cell' ) {
                highlight.type = 'cell';
                highlight.id = colId;
                highlight.value = colLabel;
            }
            this.highlights.push( highlight );
        }
    }
    this.updateHighlights();
    
    pentaho.events.trigger( this, "select", args );
}


pentaho.VizController.prototype.createCombination = function() {

    // assume the highlighted items are of the same type
    var type, columnId, values = [];
    for( var idx=0; idx<this.highlights.length; idx++ ) {
        if( idx==0) {
            type = this.highlights[idx].type;
            values.push(this.highlights[idx].value);
            columnId = this.highlights[idx].id;
        }
        else if(this.highlights[idx].id == columnId) {
            values.push(this.highlights[idx].value);
        }
    }
    this.combinations.push( {
        values: values,
        columnId: columnId
    });
    this.setupTable();
    // now clear the selections
    this.highlights = [];
    this.updateVisualization();

}

/*
    updateHighlights
    Updates all of the highlights on the visualization
*/
pentaho.VizController.prototype.updateHighlights = function() {

        if( this.chart.setHighlights ) {
            this.chart.setHighlights(this.highlights);
        }

}

/*
    updateHighlights
    Clears all of the highlights on the visualization
*/
pentaho.VizController.prototype.clearSelections = function() {
    this.highlights = [];
}


pentaho.VizController.prototype.setupTable = function( ) {

    if(!this.origTable) {
        return;
    }
    
    this.metrics = [];
    this.dataTable = this.origTable;
    
    // apply any local combinations
    if( this.combinations && this.combinations.length > 0 ) {
            var rows = this.origTable.getFilteredRows([{column: 0, combinations: this.combinations}]);
            var view = new pentaho.DataView(table);
            view.setRows( rows );
            this.dataTable = view;
    }

    // get metrics across the entire dataset in case we need them
    for( var colNo=0; colNo<this.dataTable.getNumberOfColumns(); colNo++) {
        if( this.dataTable.getColumnType(colNo) == 'string' ) {
            var values = this.dataTable.getDistinctValues(colNo);
            var paletteMap = pentaho.VizController.createPaletteMap( values, this.palette );
            this.metrics.push({
                values: values,
                paletteMap: paletteMap
            });
        }
        else if( this.dataTable.getColumnType(colNo) == 'number' ) {
            var range = this.dataTable.getColumnRange(colNo);
            this.metrics.push({range: range});
        }
    }
    
}

function sort( columnIdx, direction ) {

    var rows = this.dataTable.sort([{column: columnIdx, desc: direction == pentaho.pda.Column.SORT_TYPES.DESCENDING}]);
    clearDataDisplay();
    displayData();
}


/*
    createPaletteMap
    Static function to create a palette map
*/
pentaho.VizController.createPaletteMap = function( items, palette ) {
    var map = {};
    for(var itemNo=0; itemNo<items.length && itemNo<palette.colors.length; itemNo++) {
        map[items[itemNo]] = palette.colors[itemNo];
    }
    // are there more items than colors in the palette?
    for(var itemNo=palette.colors.length; itemNo<items.length; itemNo++) {
        map[items[itemNo]] = "#000000";
    }
    
    return map;
}

/*
    createPaletteMap
    Static function to create a color within a color gradient
    Return  an RGB() color
*/
pentaho.VizController.getRrbGradient = function(value, min, max, color1, color2) {
     
        var inRange = (value-min)/(max-min);
        var cols = new Array(3);
        cols[0] = Math.floor( inRange * (color2[0] - color1[0]) + color1[0] );
        cols[1] = Math.floor( inRange * (color2[1] - color1[1]) + color1[1] );
        cols[2] = Math.floor( inRange * (color2[2] - color1[2]) + color1[2] );
        return pentaho.VizController.getRrbColor(cols[0], cols[1], cols[2]);
    }

/*
    createPaletteMap
    Static function to create a RGB color
    Return  an RGB() color
*/
pentaho.VizController.getRrbColor = function(r, g, b) {
        return 'RGB('+r+','+g+','+b+')';
}