import './App.css';
import React from "react";

const spaces = {
    EMPTY: '',
    WHITE: '\u25EF',
    BLACK: '\u2B24',
    WHITE_KING: '\u2654',
    BLACK_KING: '\u265A'
}

const states = {
    UNSELECTED: "unselected",
    SELECTABLE: "selectable",
    SELECTED: "selected",
}

const positions = [0, 1, 2, 3, 4, 5, 6, 7];

class App extends React.Component {
    constructor(props) {
        super(props);
        var board = positions.map(y => positions.map(x => this.startColor(x, y)));
        this.state = {
            board: board, //the board and pieces in each space
            boardState: null, //the board and state (unselected, selected, selectable) of each space
            nextPlayer: spaces.BLACK, //the player who should move a piece next
            selectedSpace: null, //the currently selected piece's space, as an object with x and y attributes
            selectedMoves: [], //the list of valid moves for the currently selected piece
            whiteAtBottom: true //if true, renders the board so that black pieces start at the bottom and move towards the top
        }
        this.state.boardState = this.selectableSpaces(this.state.board,
            this.state.nextPlayer,
            this.state.selectedSpace
        ).state;
    }
    render() {
        return (
        <div>
            <Board handleClick={(x, y) => this.clickHandler(x, y)} {...this.state}/>
            <div id="nextPlayer">Next player: {(this.state.nextPlayer === spaces.BLACK) ? "Black" : "White"}</div>
            <label>
                <input type="checkbox" onClick={() => {
                    this.setState({whiteAtBottom: !this.state.whiteAtBottom});
                }}/>
                <span>White starts at bottom</span>
            </label>
            
        </div>
        );
    }

    startColor(x, y) {
        if ((y !== 3) && (y !== 4) && ((x + y) % 2 === 0)) {
            if (y < 3) {
                return spaces.BLACK;
            } else {
                return spaces.WHITE;
            }
        } else {
            return spaces.EMPTY;
        }
    }

    selectableSpaces(board, nextPlayer, selectedSpace) {
        /*
        Returns the an object which reflects the currently selectable and selected spaces.
        The object's attributes are:
        state: the new board state
        found: true if and only if at least one valid move was found
        */
        var playerPieces = (nextPlayer === spaces.BLACK) ? [spaces.BLACK, spaces.BLACK_KING] : [spaces.WHITE, spaces.WHITE_KING];
        var validMoves;
        var moveFound = false;
        var newBoardState = positions.map(y => positions.map(x => states.UNSELECTED));
        if (selectedSpace == null) {
            //find all player-controlled pieces with valid moves
            positions.forEach(y => {
                positions.forEach(x => {
                    if (playerPieces.includes(board[y][x])) {
                        validMoves = this.getValidMoves(board, nextPlayer, x, y); //get valid moves for the space
                        if (validMoves.length > 0) {
                            newBoardState[y][x] = states.SELECTABLE;
                            moveFound = true;
                        }
                    }
                })
            });
        } else {
            moveFound = true; //if the space was selected, there was a valid move
            newBoardState[selectedSpace.y][selectedSpace.x] = states.SELECTED;
            validMoves = this.getValidMoves(board, nextPlayer, selectedSpace.x, selectedSpace.y);
            validMoves.forEach(element => {
                newBoardState[element.y][element.x] = states.SELECTABLE;
            });
        }
        return {state: newBoardState, found: moveFound};
    }

    getValidMoves(board, nextPlayer, x, y) {
        /*
        Returns an array of objects describing the valid moves for the piece at coordinates (x, y).
        Objects have the following properties:
        x : x-coordinate of the piece after the move
        y : y-coordinate of the piece after the move
        takenPiece : {x, y} coordinates of the taken piece, or null if none taken
        */
        
        var enemyPieces = (nextPlayer === spaces.BLACK) ? [spaces.WHITE, spaces.WHITE_KING] : [spaces.BLACK, spaces.BLACK_KING];
        var factor = (nextPlayer === spaces.BLACK) ? 1 : -1;
        var isKing = board[y][x] === spaces.BLACK_KING || board[y][x] === spaces.WHITE_KING;
        var validMoves = [];
        var moves = [
            {
                x: -factor,
                y: factor,
                takenPiece: null
            },
            {
                x: factor,
                y: factor,
                takenPiece: null
            },
            {
                x: -2 * factor,
                y: 2 * factor,
                takenPiece: {x: -factor, y: factor}
            },
            {
                x: 2 * factor,
                y: 2 * factor,
                takenPiece: {x: factor, y: factor}
            },
        ];
        if (isKing) {
            moves = moves.concat(moves.map(move => {
                return {
                    ...move,
                    x: -move.x,
                    y: -move.y
                };
            }));
        }
        moves.forEach(move => {
            var targetX = x + move.x;
            var targetY = y + move.y;
            //check if the move is within bounds
            if (targetX < 8 && targetX >= 0 && targetY < 8 && targetY >= 0) {
                //the move is valid if the space is empty
                if (board[targetY][targetX] === spaces.EMPTY) {
                    if (!move.takenPiece) {
                        validMoves.push({
                            x: targetX,
                            y: targetY,
                            takenPiece: null
                        });
                    } else if (enemyPieces.includes(board[y + move.takenPiece.y][x + move.takenPiece.x])) {
                        validMoves.push({
                            x: targetX,
                            y: targetY,
                            takenPiece: {
                                x: x + move.takenPiece.x,
                                y: y + move.takenPiece.y
                            }
                        });
                    }
                }
            }
        });
        return validMoves;
    }

    executeMove(board, space, move, player) {
        /*
        Returns the new board after the given move is played. The move is an object in the format returned
        by getValidMoves and is assumed to be valid.
        */
        var newBoard = board;
        var nextPlayer = (player === spaces.BLACK) ? spaces.WHITE : spaces.BLACK;
        var newSelectedSpace = null;
        // var nextPlayer = (move.takenPiece != null) ? nextPlayer : ((this.state.nextPlayer == spaces.BLACK) ? spaces.WHITE : spaces.BLACK);
        // var newSelectedSpace = (move.takenPiece != null) ? {x: move.x, y: move.y} : null;
        //move the piece to its new position
        newBoard[move.y][move.x] = newBoard[space.y][space.x];
        newBoard[space.y][space.x] = spaces.EMPTY;
        //if a piece was taken, remove it
        if (move.takenPiece) {
            newBoard[move.takenPiece.y][move.takenPiece.x] = spaces.EMPTY;
        }
        return {board: newBoard, selectedSpace: newSelectedSpace, nextPlayer: nextPlayer};
    }

    clickHandler(x, y) {
        /*
        Function that handles a click at the given (x, y) position on the board.
        Updates the board and game state accordingly.
        */
        if (this.state.boardState[y][x] === states.UNSELECTED) {
            return;
        }
        var newBoard = this.state.board;
        var newBoardState = this.state.boardState;
        var newSelected = this.state.selectedSpace;
        var newPlayer = this.state.nextPlayer;
        var selectedMoves = this.state.selectedMoves;
        if (newBoardState[y][x] === states.SELECTED) {
            newSelected = null;
        } else {
            if (newSelected == null) {
                //select the new space
                newSelected = {x: x, y: y};
                selectedMoves = this.getValidMoves(newBoard, this.state.nextPlayer, x, y);
            } else {
                //find and execute the corresponding move
                var move = null;
                for (let i = 0; i < selectedMoves.length; i++) {
                    move = selectedMoves[i];
                    if (move.x === x && move.y === y) {
                        break;
                    }
                }
                ({board: newBoard, nextPlayer: newPlayer, selectedSpace: newSelected} = this.executeMove(newBoard, this.state.selectedSpace, move, this.state.nextPlayer));
            }
        }
        newBoardState = this.selectableSpaces(newBoard, newPlayer, newSelected).state;
        this.setState({
            board: newBoard,
            boardState: newBoardState,
            selectedSpace: newSelected,
            nextPlayer: newPlayer,
            selectedMoves: selectedMoves
        })
    }
}

class Board extends React.Component {
    render() {
        var rows = positions.slice();
        if (this.props.whiteAtBottom) {
            rows.reverse();
        }
        return (
        <div className="board" style={{marginTop: `20px`, marginBottom: `20px`}}>
            {
                rows.map(y => this.renderRow(y))
            }
        </div>
        );
    }

    renderRow(y) {
        return (
        <div className="row" key={y}>
            {positions.map(x => this.renderSquare(x, y))}
        </div>
        );
    }

    renderSquare(x, y) {
        return <Square value={this.props.board[y][x]} squarestate={this.props.boardState[y][x]} onClick={() => this.props.handleClick(x, y)} key={x}/>;
    }
}

class Square extends React.Component {
    render() {
        return (
        <button className="square" squarestate={this.props.squarestate} onClick={this.props.onClick}>
            {this.props.value}
        </button>
        );
    }
}

export default App;
