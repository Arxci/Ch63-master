$("#SetFen").click(function () {
	var fenStr = $("#fenIn").val();	
	NewGame(fenStr);
});
var highlighted = {}

$('#TakeButton').click( function () {
	if(GameBoard.hisPly > 0) {
		TakeMove();
		GameBoard.ply = 0;
		SetInitialBoardPieces(0);
	}
});

$('#NewGameButton').click( function () {
	NewGame(START_FEN);
});

function NewGame(fenStr) {
	$(squares[highlighted.to]).removeClass('SqSelected');
	$(squares[highlighted.from]).removeClass('SqSelected');
	GenerateMoves();
	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
		move = GameBoard.moveList[index];
		to = TOSQ(move)
		$(squares[SQ64(to)]).removeClass('to')
	}
	ParseFen(fenStr);
	PrintBoard();
	SetInitialBoardPieces(1250);
	CheckAndSet();
	highlighted = {}
}

function ClearAllPieces() {
	$(".Piece").remove();
}

function SetInitialBoardPieces(delay) {

	var sq;
	var sq120;
	var pce;
	var pieces = [];
	
	ClearAllPieces();
	
	for(sq = 0; sq < 64; ++sq) {
		sq120 = SQ120(sq);
		pce = GameBoard.pieces[sq120];
		if(pce >= PIECES.wP && pce <= PIECES.bK) {
			pieces.push([sq120, pce]);
		}
	}

	var index = 0;
	var timer;
	setTimeout(function() {
		timer = setInterval(function() {
			AddGUIPiece(pieces[index][0], pieces[index][1]);
			index++;
			if (index == pieces.length) {
				clearInterval(timer);
			}
		}, 15)
	}, delay)

}

function DeSelectSq(sq) {
	$('.Square').each( function(index) {
		if(PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
				$(this).removeClass('SqSelected');
		}
	} );
}

function SetSqSelected(sq) {
	$('.Square').each( function(index) {
		if(PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
				$(this).addClass('SqSelected');
		}
	} );
}

function ClickedSquare(pageX, pageY) {
	console.log('ClickedSquare() at ' + pageX + ',' + pageY);
	var position = $('#Board').position();
	
	var workedX = Math.floor(position.left);
	var workedY = Math.floor(position.top);
	
	pageX = Math.floor(pageX);
	pageY = Math.floor(pageY);
	
	var file = Math.floor((pageX-workedX) / (60 / windowSize));
	var rank = 7 - Math.floor((pageY-workedY) / (60 / windowSize));
	
	var sq = FR2SQ(file,rank);
	
	console.log('Clicked sq:' + PrSq(sq));
	
	SetSqSelected(sq);	
	
	return sq;
}

$(document).on('click','.Piece', function (e) {
	console.log('Piece Click');
	
	if(UserMove.from == SQUARES.NO_SQ) {
		UserMove.from = ClickedSquare(e.pageX, e.pageY);
		GenerateMoves();
		for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
			move = GameBoard.moveList[index];
			to = TOSQ(move)
			from = FROMSQ(move)
			if (UserMove.from == from ) {
				if (GameBoard.pieces[to] != 0) {
					$(squares[SQ64(to)]).addClass('enemy');

				} else {
					$(squares[SQ64(to)]).addClass('to');
					console.log(GameBoard.pieces[to])
				}
			}
		}
	} else {
		UserMove.to = ClickedSquare(e.pageX, e.pageY);
		GenerateMoves();
		for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
			move = GameBoard.moveList[index];
			to = TOSQ(move)
			$(squares[SQ64(to)]).removeClass('to');
			$(squares[SQ64(to)]).removeClass('enemy')
		}
	}
	
	MakeUserMove();
});

$(document).on('click','.Square', function (e) {
	console.log('Square Click');	
	GenerateMoves();
	for(index = GameBoard.moveListStart[GameBoard.ply]; index < GameBoard.moveListStart[GameBoard.ply+1]; ++index) {
		move = GameBoard.moveList[index];
		to = TOSQ(move)
		$(squares[SQ64(to)]).removeClass('to')
		$(squares[SQ64(to)]).removeClass('enemy')
	}
	if(UserMove.from != SQUARES.NO_SQ) {
		UserMove.to = ClickedSquare(e.pageX, e.pageY);
		MakeUserMove();
	}
});

function MakeUserMove() {

	if(UserMove.from != SQUARES.NO_SQ && UserMove.to != SQUARES.NO_SQ) {
	
		console.log("User Move:" + PrSq(UserMove.from) + PrSq(UserMove.to));	
		
		var parsed = ParseMove(UserMove.from,UserMove.to);
		
		if(parsed != NOMOVE) {
			MakeMove(parsed);
			PrintBoard();
			MoveGUIPiece(parsed);
			CheckAndSet();
			PreSearch();
		}
	
		DeSelectSq(UserMove.from);
		DeSelectSq(UserMove.to);
		
		UserMove.from = SQUARES.NO_SQ;
		UserMove.to = SQUARES.NO_SQ;
	}
}

function PieceIsOnSq(sq, top, left) {

	if( (RanksBrd[sq] == 7 - Math.round(top/(60 / windowSize)) ) && 
		FilesBrd[sq] == Math.round(left/(60 / windowSize)) ) {
		return BOOL.TRUE;
	}
		
	return BOOL.FALSE;

}

function RemoveGUIPiece(sq) {

	$('.Piece').each( function(index) {
		if(PieceIsOnSq(sq, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
			$(this).remove();
		}
	} );
	
}

function AddGUIPiece(sq, pce) {

	var color = '';
    var pieceTypes = {
        R: 'fas fa-chess-rook',
        B: 'fas fa-chess-bishop',
        N: 'fas fa-chess-knight',
        K: 'fas fa-chess-king',
        Q: 'fas fa-chess-queen',
        P: 'fas fa-chess-pawn',
    }
	var file = FilesBrd[sq];
	var rank = RanksBrd[sq];
	var rankName = "rank" + (rank+1);
	var	fileName = "file" + (file+1);
    switch (pce) {
		case 1: 
		case 2:
		case 3:
		case 4:
		case 5:
		case 6:
       		color = 'white';
			break;
    }
	imageString = "<i class=\"Piece " + pieceTypes[PceChar[pce].toUpperCase()] + ' ' + color + ' ' + rankName + " " + fileName + "\"/>";
    $("#Board").append(imageString);
}

function MoveGUIPiece(move) {
	var from = FROMSQ(move);
	var to = TOSQ(move);	
	$(squares[highlighted.to]).removeClass('SqSelected');
	$(squares[highlighted.from]).removeClass('SqSelected');
	
	if(move & MFLAGEP) {
		var epRemove;
		if(GameBoard.side == COLOURS.BLACK) {
			epRemove = to - 10;
		} else {
			epRemove = to + 10;
		}
		RemoveGUIPiece(epRemove);
	} else if(CAPTURED(move)) {
		RemoveGUIPiece(to);
	}
	
	var file = FilesBrd[to];
	var rank = RanksBrd[to];
	var rankName = "rank" + (rank+1);
	var	fileName = "file" + (file+1);
	
	$('.Piece').each( function(index) {
		if(PieceIsOnSq(from, $(this).position().top, $(this).position().left) == BOOL.TRUE) {
			$(this).removeClass();
			$(this).addClass("Piece " + rankName + " " + fileName);
			AddGUIPiece(to, GameBoard.pieces[to]);
		}
	} );

	if(move & MFLAGCA) {
		switch(to) {
			case SQUARES.G1: RemoveGUIPiece(SQUARES.H1); AddGUIPiece(SQUARES.F1, PIECES.wR); break;
			case SQUARES.C1: RemoveGUIPiece(SQUARES.A1); AddGUIPiece(SQUARES.D1, PIECES.wR); break;
			case SQUARES.G8: RemoveGUIPiece(SQUARES.H8); AddGUIPiece(SQUARES.F8, PIECES.bR); break;
			case SQUARES.C8: RemoveGUIPiece(SQUARES.A8); AddGUIPiece(SQUARES.D8, PIECES.bR); break;
		}
	} else if (PROMOTED(move)) {
		RemoveGUIPiece(to);
		AddGUIPiece(to, PROMOTED(move));
	}

	highlighted.to = SQ64(to);
	highlighted.from = SQ64(from);
	$(squares[highlighted.to]).addClass('SqSelected');
	$(squares[highlighted.from]).addClass('SqSelected');
}

function DrawMaterial() {

	if (GameBoard.pceNum[PIECES.wP]!=0 || GameBoard.pceNum[PIECES.bP]!=0) return BOOL.FALSE;
	if (GameBoard.pceNum[PIECES.wQ]!=0 || GameBoard.pceNum[PIECES.bQ]!=0 ||
					GameBoard.pceNum[PIECES.wR]!=0 || GameBoard.pceNum[PIECES.bR]!=0) return BOOL.FALSE;
	if (GameBoard.pceNum[PIECES.wB] > 1 || GameBoard.pceNum[PIECES.bB] > 1) {return BOOL.FALSE;}
    if (GameBoard.pceNum[PIECES.wN] > 1 || GameBoard.pceNum[PIECES.bN] > 1) {return BOOL.FALSE;}
	
	if (GameBoard.pceNum[PIECES.wN]!=0 && GameBoard.pceNum[PIECES.wB]!=0) {return BOOL.FALSE;}
	if (GameBoard.pceNum[PIECES.bN]!=0 && GameBoard.pceNum[PIECES.bB]!=0) {return BOOL.FALSE;}
	 
	return BOOL.TRUE;
}

function ThreeFoldRep() {
	var i = 0, r = 0;
	
	for(i = 0; i < GameBoard.hisPly; ++i) {
		if (GameBoard.history[i].posKey == GameBoard.posKey) {
		    r++;
		}
	}
	return r;
}

function CheckResult() {
	if(GameBoard.fiftyMove >= 100) {
		 $("#GameStatus").text("GAME DRAWN"); 
		 $(".game__status").addClass('active');
		 return BOOL.TRUE;
	}
	
	if (ThreeFoldRep() >= 2) {
     	$("#GameStatus").text("GAME DRAWN"); 
		 $(".game__status").addClass('active');
     	return BOOL.TRUE;
    }
	
	if (DrawMaterial() == BOOL.TRUE) {
     	$("#GameStatus").text("GAME DRAWN"); 
		 $(".game__status").addClass('active');
     	return BOOL.TRUE;
    }
    
    GenerateMoves();
      
    var MoveNum = 0;
	var found = 0;
	
	for(MoveNum = GameBoard.moveListStart[GameBoard.ply]; MoveNum < GameBoard.moveListStart[GameBoard.ply + 1]; ++MoveNum)  {	
       
        if ( MakeMove(GameBoard.moveList[MoveNum]) == BOOL.FALSE)  {
            continue;
        }
        found++;
		TakeMove();
		break;
    }
	
	if(found != 0) return BOOL.FALSE;
	
	var InCheck = SqAttacked(GameBoard.pList[PCEINDEX(Kings[GameBoard.side],0)], GameBoard.side^1);
	
	if(InCheck == BOOL.TRUE) {
		if(GameBoard.side == COLOURS.WHITE) {
	      $("#GameStatus").text("YOU LOSE");
		  $(".game__status").addClass('active');
	      return BOOL.TRUE;
        } else {
	      $("#GameStatus").text("YOU WIN");
		  $(".game__status").addClass('active');
	      return BOOL.TRUE;
        }
	} else {
		$("#GameStatus").text("GAME DRAWN");
		$(".game__status").addClass('active');
		return BOOL.TRUE;
	}
}

function CheckAndSet() {
	if(CheckResult() == BOOL.TRUE) {
		GameController.GameOver = BOOL.TRUE;
	} else {
		GameController.GameOver = BOOL.FALSE;
		$("#GameStatus").text('');
	}
}

function PreSearch() {
	if(GameController.GameOver == BOOL.FALSE) {
		SearchController.thinking = BOOL.TRUE;
		setTimeout( function() { StartSearch(); }, 200 );
	}
}

function StartSearch() {

	SearchController.depth = MAXDEPTH;
	
	SearchController.time = 1000;
	SearchPosition();
	
	MakeMove(SearchController.best);
	MoveGUIPiece(SearchController.best);
	CheckAndSet();
}














































