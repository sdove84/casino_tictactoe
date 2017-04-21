var main_game = null;
var games_played = 0;
var player_1_score = 0;
var player_2_score = 0;
var global_current_player = 0;
var isUltimate = false;
var xImage = "images/red_chip.png";
var oImage = "images/blue_chip.png";
var size = 3;

$(document).ready(function(){
    $('#ultimate_button').click(ultimate);
    $('#reset_button').click(reset);
    main_game = new game_template($('.game_board'), size, size); //creates a new game_template object called main_game
    main_game.create_cells(size, size); //calls create_cells() method in main_game object to create size * size (3x3 = 9) cells in the .game_board
    main_game.create_players(); //calls create_players method in main_game object to create player 1 and player 2 and activates player 1 as the current player since it will be the first turn
    $('#settings_button').click(settings_clicked);
    $('#settings-popup-bg').click(function() {
        $('#settings-container').hide();
    });
    $('#select-cells').change(function() {
        size = parseInt( $('#select-cells').val() );
        reset();
        $('#settings-container').hide();
    });
});

function ultimate(){ //resets the board to a 3x3 & converts each of the current board's cells into a new board
    size = 3;
    reset();
    for (var i = 0; i < 9; i++) {
        $(main_game.cell_array[i].element).unbind('click');
    }
    main_game = [];
    $(".ttt_cell").html("");
    for (i = 0; i < 9; i++) {
        main_game.push(new game_template($('.game_board > .ttt_cell:eq('+ i +')'), size, size));
        main_game[i].create_cells(size, size);
        main_game[i].create_players();
    }
    isUltimate = true;
    global_current_player = 0;
    $('#player_2').removeClass('active_player');
}

function reset(){ //clears the board and makes a new game object
    isUltimate = false;
    $(".game_board").html("");
    $("#pxScore").text(player_1_score);
    $("#poScore").text(player_2_score);
    $("#gpSpan").text(++games_played);
    $('#player_2').removeClass('active_player');
    main_game = new game_template($('.game_board'),size,size);
    main_game.create_cells(size,size);
    main_game.create_players();
    global_current_player=0;
}

function settings_clicked() {
    $('#settings-container').show();
}

var cell_template = function(parent){
    var self = this;
    this.parent = parent; //the game_template (game board) that created the cell
    this.element = null; //placeholder for the div created by create_self()
    this.symbol = null; //placeholder for the symbol of the current player
    this.cell_width = 100 / this.parent.rows; //divides 100 by the amount of cells in a row to get a percentage for the width of the cells
    this.create_self = function(){ //create and return a div with class ttt_cell
        this.element = $("<div>",
            {
                class:'ttt_cell',
                width: this.cell_width + "%",
                height: this.cell_width + "%",
                html:'&nbsp;' //space character that prevents an automatic line break at its position
            }
        ).click(this.cell_click);
        return this.element;
    };
    this.cell_click = function(){ //puts the player's symbol in a cell
        if(self.element.hasClass('selected')){ //if the clicked cell was already selected, return
            return;
        }
        var current_player = self.parent.get_current_player();
        self.symbol = current_player.get_symbol();
        self.element.addClass('selected');
        self.change_symbol(self.symbol);
        self.parent.cell_clicked(self);
    };
    this.change_symbol = function(symbol){ //alternates between the two player symbols
        if (symbol == "X") {
            this.element.html('<img src="'+ xImage +'">');
        } else {
            this.element.html('<img src="'+ oImage +'">');
        }
    };
    this.get_symbol = function(){
        /*
        gets the symbol inside the current cell
        called by check_win_conditions() in the game_template
        it loops through each cell and gets the symbols of each to test if the win condition is met
        */
        return this.symbol;
    };
};
var game_template = function(main_element, rows, cols){
    var self = this;
    this.element = main_element; //assigns main_element (the main game board div) to this.element
    this.rows = rows;
    this.cols = cols;
    this.cell_array = []; //stores the created game cell objects (this.create_cells())
    this.players = []; //stores the players (X and O in a normal game)
    this.current_player = 0; //alternates between 0 and 1

    this.win_conditions = set_win_conditions(this.rows, this.cols); //an array of all possible winning combinations based on board size
    this.create_cells = function(rows, cols) { //creates number of tic tac toe cells based on cell_count parameter (9 would be a normal game)
        var cell_count = rows * cols;
        for (var i = 0; i < cell_count; i++) { //loops based on cell_count amount (9 times in a normal game)
            var cell = new cell_template(this); //creates a new cell OBJECT and passes the current game_template as the cell's parent parameter
            var cell_element = cell.create_self(); //new cell object creates a div for itself. this element is assigned to the cell_element variable
            this.cell_array.push(cell); //pushes the loop's current cell object to the array this.cell_array
            this.element.append(cell_element); //appends the div created by the cell to the main_element (the game board div)
        }
    };
    this.create_players = function(){
        var player1 = new player_template('X' , $('#player_1')); //creates new player_template object with symbol: X, and element with id #player1
        var player2 = new player_template('O', $('#player_2')); //creates new player_template object with symbol: O, and element: with id #player2
        this.players.push(player1); //pushes player 1 (X) to the players array (this.players))
        this.players.push(player2); //pushes player 2 (O) to the players array (this.players))
        this.players[0].activate_player(); //calls activate_player() method on the object in this.players array at index 0 (it's player 1 (X)). activate player says whose turn it is
    };
    this.switch_players = function(){ //alternates between two players
        if(global_current_player){ //if the current player index isn't 0, it's 1
            global_current_player=0; //makes current player's index 0
        } else{ //if current player is 0
            global_current_player=1; //makes current player's index 1
        }
    };
    this.get_current_player = function(){ //returns the player object at the current_player index in the this.players array
        return this.players[global_current_player];
    };
    this.cell_clicked = function(clicked_cell){
        self.check_win_conditions(); //check if the clicked cell won the game
        self.check_draw(); //check for a draw game
        self.players[global_current_player].deactivate_player(); //remove the active_player class from their element
        self.switch_players(); //change the current_players property to the next player's index in the players array
        self.players[global_current_player].activate_player();//calls activate player on the now switched current player to add the active_player class to their element
    };
    this.check_win_conditions = function(){
        var current_player_symbol = this.players[global_current_player].get_symbol();
        for(var i=0; i<this.win_conditions.length;i++){
        /*
        loops through every item in win_conditions array
        each item is also an array (an array of 3 cells needed to win a game)
        we loop through THAT next in the j loop
        */
            var count=0; //count will increment by one for each cell in the sub array that the current player has a space in
            for(var j=0; j<this.win_conditions[i].length; j++){ //loops through each item in the current array that was in the win_conditions array
                if(this.cell_array[this.win_conditions[i][j]].get_symbol() == current_player_symbol){ //if the symbol of the current index (j) in the 3 cells array inside the win_conditions array is the same as the current player's symbol
                    count++; //increment count (when count is 3 you win in a normal game)
                    if(count===this.rows){
                        this.player_wins(this.players[global_current_player]); //calls this.player_wins method and passes it the current player (player in the players array at the current_player's index)
                    }//end of count == 3
                } //end of symbols match
            } //end of inner loop
        } //end of outer loop
    };
    this.check_draw = function(){
        var selected = $(this.element).find('.selected').length; //assigns the amount of elements with the class 'selected' that are children of this game board to variable
        var game_over = $(this.element).find('.game_over').length; //assigns the amount of elements with the class 'game_over' that are children of this game board to variable
        if (selected === this.rows * this.cols && !game_over ) { //if all the cells are selected and no cells have class 'game_over'
            win_msg("Draw Game");
        }
    };
    this.player_wins = function(player){
        for (var i = 0; i < this.cell_array.length; i++) {
            this.cell_array[i].element.addClass('selected game_over');
        }
        if (isUltimate) {
            if (player.get_symbol() === "X") {
                this.element.attr('data', global_current_player);
                this.element.addClass('selected');
                this.element.html('<img src="' + xImage + '">');
                check_ultimate_win();
            } else {
                this.element.attr('data', global_current_player);
                this.element.addClass('selected');
                this.element.html('<img src="' + oImage + '">');
                check_ultimate_win();
            }
        } else {
            if (player.get_symbol() == "X") {
                win_msg('Red won the game');
            }  else {
                win_msg('Blue won the game');
            }

        }
        if(player.get_symbol()==='X'){
            player_1_score++;
            $('#p1Span').text(player_1_score);
        }
        else{
            player_2_score++;
            $('#p2Span').text(player_2_score);
        }
    };
};

var player_template = function(symbol, element){
    this.symbol = symbol;
    this.element = element;
    this.activate_player = function(){ //adds class "active_player" to the element given in the element parameter (eg: id #player1)
        this.element.addClass('active_player');
    };
    this.deactivate_player = function(){ //removes class "active_player" from the element given
        this.element.removeClass('active_player');
    };
    this.get_symbol = function(){ //returns the symbol (e.g: "X") given in the symbol parameter when the method was called in create_players
        return this.symbol;
    };
};

function set_win_conditions(height, width) {
    var win_conditions = [];
    var temp_array = [];
//ROWS
    for (var i = 0; i < height * width; i = j) {
        //i starts at 0
        //stop loop before i = the amount of cells on the board
        //after the work: set i to the value of j
        //will be the first value in the next row after j loop completes a row
        for (var j = i; j < i + width; j++) {
            //j will start as the value of i when each row is started
            //stop before j = value of first cell + the amount of cells in a row
            //eg: on row 1 with 3 cells per row, j < 0 + 3 will stop the row on 2
            //after the work: increment j by 1
            temp_array.push(j);
            //put the current value of j in the temporary array
        }
        win_conditions.push(temp_array);
        //puts the array of the completed row into the win conditions array
        temp_array = [];
        //clears temporary array for the next row to use it
    }
//COLUMNS
    for (i = 0; i < width; i++) {
        //i starts as 0
        //stop loop before i = the amount of columns on the board
        //after the work: increment i by one
        for (j = i; j < width * height; j += width) {
            //j starts as the value of i when each column is started
            //stop before j = the amount of cells on the board
            //in a 3x3 board the last index we'd need to use is 8
            //since there are 9 cells on a 3x3 board, this would stop before 9, or in other words, on 8
            //after the work: add the amount of columns to j
            //eg: on a 3x3 board, start on 0, the next index in the column would be 3
            //j (0: first index) + width (3 cells) = next item in column
            //0 + 3 = 3, j is now 3
            //3 + 3 = 6, j is now 6
            //6 + 3 = 9, j is 9 (width*height) so the loop stops
            //on the next loop, i will increment so j will start as 1 since i incremented
            temp_array.push(j);
        }
        win_conditions.push(temp_array);
        temp_array = [];
    }
//DIAGONALS NW TO SE
    for (i = 0; i < height * width; i += width + 1) {
        //i starts as 0
        //stop before i = total amount of cells
        //after the work: add the amount of columns + 1 to i
        //eg: in a 4x4 board, the first cell in a diagonal would be index 0
        //the next cell would be one row down and one column to the right of that
        //if we add the amount of columns to i we'll be on the next row
        //eg: 0 + width (4) = 4
        /*
         [0, 1, 2, 3],
         [4, 5, 6, 7],
         [8, 9, 10, 11],
         [12, 13, 14, 15]
         */
        //we just add one to that number to move one space to the right
        //the next time we do this we'll land on 10
        //5 + 4 (the width) + 1 = 10
        temp_array.push(i);
    }
    win_conditions.push(temp_array);
    temp_array = [];
//DIAGONALS NE to SW
    for (i = width - 1; i <= height * width - width; i += width - 1) {
        //i starts as the total amount of columns - 1
        //subtracting 1 from the amount of columns gives us the index of the last cell in the first row
        //in a 3x3 board this means we start on index 2, or the 3rd cell
        //3 (width) - 1 = 2;
        //stop when i is EQUAL to the index of the cell in the bottom left corner
        //after the work: add the amount of columns - 1 to i
        //eg: on a 3x3 board, if we start on 2, add 3
        //we're now one row down, or on 5
        /*
         [0, 1, 2],
         [3, 4, 5],
         [6, 7, 8]
         */
        //subtract one more and we've shifted one cell to the left, on 4
        temp_array.push(i);
    }
    win_conditions.push(temp_array);
    return win_conditions;
}

function check_ultimate_win() {
    var ultimate_wins = set_win_conditions(3,3);
    var ultimate_cells = $('.game_board > .ttt_cell'); //select the ttt_cells that are direct children of game_board only
    for(var i=0; i<ultimate_wins.length;i++){ //loop for every possible win condition
        var count=0; //reset count for each loop
        for(var j=0; j<ultimate_wins[i].length; j++){ //loop for each required space in a win condition array
            if($(ultimate_cells[ultimate_wins[i][j]]).attr('data') == global_current_player) {
                //selects the ttt_cell at the index inside the win condition array
                //compares the data attribute to the global_current_player variable
                count++; //increment count for each match
                if(count===3){ //if you get 3 in a row
                    if (global_current_player) {
                        win_msg("Blue wins");
                        $('.ttt_cell').addClass('selected game_over');
                    } else {
                        win_msg("Red wins");
                        $('.ttt_cell').addClass('selected game_over');
                    }
                }
            }
        }
    }
    var selected = $('.game_board').find('.selected').length;
    var game_over = $('.game_board').find('.game_over').length;
    if (selected === 9 && !game_over ) { //if all the cells are selected and no cells have class 'game_over'
        win_msg("Draw Game");
    }
}

function win_msg(msg) {
    $("#myModal").modal();
    $(".modal-body").text(msg);
}