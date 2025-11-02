import React, { useState, useEffect, useCallback } from 'react';

// 棋盘大小常量
const BOARD_SIZE = 15; // 15x15棋盘
const CELL_SIZE = 30; // 每个单元格的大小
const BOARD_DIMENSION = CELL_SIZE * (BOARD_SIZE - 1); // 棋盘总尺寸

// 游戏状态常量
const GAME_STATUS = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  BLACK_WIN: 'black_win',
  WHITE_WIN: 'white_win',
  DRAW: 'draw'
};

// 棋子类型常量
const PIECE_TYPE = {
  EMPTY: 0,
  BLACK: 1,
  WHITE: 2
};

function App() {
  // 状态管理
  const [board, setBoard] = useState([]); // 棋盘状态
  const [currentPlayer, setCurrentPlayer] = useState(PIECE_TYPE.BLACK); // 当前玩家
  const [gameStatus, setGameStatus] = useState(GAME_STATUS.PLAYING); // 游戏状态
  const [moveHistory, setMoveHistory] = useState([]); // 落子历史记录
  const [lastMove, setLastMove] = useState(null); // 最后一步位置
  const [showModal, setShowModal] = useState(false); // 模态框显示状态
  const [modalContent, setModalContent] = useState({ title: '', message: '' }); // 模态框内容
  const [errorMessage, setErrorMessage] = useState(''); // 错误信息

  // 初始化棋盘
  const initializeBoard = useCallback(() => {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(PIECE_TYPE.EMPTY));
    setBoard(newBoard);
    setCurrentPlayer(PIECE_TYPE.BLACK);
    setGameStatus(GAME_STATUS.PLAYING);
    setMoveHistory([]);
    setLastMove(null);
    setErrorMessage('');
  }, []);

  // 组件挂载时初始化棋盘
  useEffect(() => {
    initializeBoard();
  }, [initializeBoard]);

  // 检查胜负
  const checkWin = useCallback((row, col, player) => {
    const directions = [
      [0, 1],  // 水平
      [1, 0],  // 垂直
      [1, 1],  // 右下对角线
      [1, -1]  // 左下对角线
    ];

    for (const [dx, dy] of directions) {
      let count = 1; // 当前位置已经有一个棋子
      
      // 正方向查找
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx;
        const newCol = col + i * dy;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && 
            board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }
      
      // 反方向查找
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx;
        const newCol = col - i * dy;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && 
            board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }
      
      // 五子连珠
      if (count >= 5) {
        return true;
      }
    }
    return false;
  }, [board]);

  // 检查是否平局
  const checkDraw = useCallback(() => {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === PIECE_TYPE.EMPTY) {
          return false; // 还有空位，不是平局
        }
      }
    }
    return true; // 棋盘已满，平局
  }, [board]);

  // 处理落子
  const handleCellClick = useCallback((row, col) => {
    // 检查游戏状态
    if (gameStatus !== GAME_STATUS.PLAYING) {
      setErrorMessage('游戏已结束，请开始新游戏');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // 检查位置是否为空
    if (board[row][col] !== PIECE_TYPE.EMPTY) {
      setErrorMessage('该位置已有棋子');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // 创建新棋盘并落子
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // 记录落子历史
    const newMoveHistory = [...moveHistory, { row, col, player: currentPlayer }];
    setMoveHistory(newMoveHistory);
    setLastMove({ row, col });

    // 检查胜负
    if (checkWin(row, col, currentPlayer)) {
      const winnerStatus = currentPlayer === PIECE_TYPE.BLACK ? GAME_STATUS.BLACK_WIN : GAME_STATUS.WHITE_WIN;
      setGameStatus(winnerStatus);
      
      // 显示胜利模态框
      setModalContent({
        title: '游戏结束',
        message: currentPlayer === PIECE_TYPE.BLACK ? '黑方获胜！' : '白方获胜！'
      });
      setShowModal(true);
    } else if (checkDraw()) {
      // 检查平局
      setGameStatus(GAME_STATUS.DRAW);
      setModalContent({
        title: '游戏结束',
        message: '平局！'
      });
      setShowModal(true);
    } else {
      // 切换玩家
      setCurrentPlayer(currentPlayer === PIECE_TYPE.BLACK ? PIECE_TYPE.WHITE : PIECE_TYPE.BLACK);
    }
  }, [board, currentPlayer, gameStatus, moveHistory, checkWin, checkDraw]);

  // 悔棋功能
  const handleUndo = useCallback(() => {
    if (moveHistory.length === 0) {
      setErrorMessage('没有可悔的棋');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // 撤销最后一步
    const newMoveHistory = moveHistory.slice(0, -1);
    setMoveHistory(newMoveHistory);

    // 恢复棋盘状态
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(PIECE_TYPE.EMPTY));
    newMoveHistory.forEach(move => {
      newBoard[move.row][move.col] = move.player;
    });
    setBoard(newBoard);

    // 更新最后一步位置
    const last = newMoveHistory.length > 0 ? newMoveHistory[newMoveHistory.length - 1] : null;
    setLastMove(last ? { row: last.row, col: last.col } : null);

    // 切换回上一个玩家
    const lastPlayer = moveHistory[moveHistory.length - 1].player;
    setCurrentPlayer(lastPlayer);

    // 恢复游戏状态
    setGameStatus(GAME_STATUS.PLAYING);
    setShowModal(false);
  }, [moveHistory]);

  // 暂停/继续游戏
  const handlePauseResume = useCallback(() => {
    if (gameStatus === GAME_STATUS.PLAYING) {
      setGameStatus(GAME_STATUS.PAUSED);
    } else if (gameStatus === GAME_STATUS.PAUSED) {
      setGameStatus(GAME_STATUS.PLAYING);
    }
  }, [gameStatus]);

  // 新游戏
  const handleNewGame = useCallback(() => {
    initializeBoard();
    setShowModal(false);
  }, [initializeBoard]);

  // 渲染棋盘网格线
  const renderGridLines = () => {
    const lines = [];
    
    // 水平线条
    for (let i = 0; i < BOARD_SIZE; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="grid-line horizontal"
          style={{
            top: `${i * CELL_SIZE}px`,
            left: '0',
            width: `${BOARD_DIMENSION}px`
          }}
        />
      );
    }
    
    // 垂直线条
    for (let i = 0; i < BOARD_SIZE; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="grid-line vertical"
          style={{
            left: `${i * CELL_SIZE}px`,
            top: '0',
            height: `${BOARD_DIMENSION}px`
          }}
        />
      );
    }
    
    return lines;
  };

  // 渲染棋盘单元格
  const renderCells = () => {
    const cells = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const pieceType = board[row][col];
        const isLastMove = lastMove && lastMove.row === row && lastMove.col === col;
        
        cells.push(
          <div
            key={`cell-${row}-${col}`}
            className="cell"
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`
            }}
            onClick={() => handleCellClick(row, col)}
          >
            {pieceType !== PIECE_TYPE.EMPTY && (
              <div className={`piece ${pieceType === PIECE_TYPE.BLACK ? 'black' : 'white'}`} />
            )}
            {isLastMove && <div className="last-move" />}
          </div>
        );
      }
    }
    return cells;
  };

  // 获取游戏状态文本
  const getGameStatusText = () => {
    switch (gameStatus) {
      case GAME_STATUS.PLAYING:
        return '游戏进行中';
      case GAME_STATUS.PAUSED:
        return '游戏已暂停';
      case GAME_STATUS.BLACK_WIN:
        return '黑方获胜';
      case GAME_STATUS.WHITE_WIN:
        return '白方获胜';
      case GAME_STATUS.DRAW:
        return '平局';
      default:
        return '';
    }
  };

  return (
    <div className="game-container">
      <h1 className="game-title">五子棋游戏</h1>
      
      <div className="game-info">
        <div className="player-info">
          <div className={`player-indicator ${currentPlayer === PIECE_TYPE.BLACK ? 'black' : 'white'}`} />
          <span className="current-player">
            当前玩家: {currentPlayer === PIECE_TYPE.BLACK ? '黑方' : '白方'}
          </span>
        </div>
        <div className="game-status">
          状态: {getGameStatusText()}
        </div>
      </div>

      {errorMessage && (
        <div style={{ color: 'red', marginBottom: '10px', fontWeight: 'bold' }}>
          {errorMessage}
        </div>
      )}

      <div 
        className="board-container"
        style={{
          width: `${BOARD_DIMENSION}px`,
          height: `${BOARD_DIMENSION}px`
        }}
      >
        <div 
          className="board"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`
          }}
        >
          {renderCells()}
        </div>
        <div className="board-grid">
          {renderGridLines()}
        </div>
      </div>

      <div className="toolbar">
        <button onClick={handleNewGame}>
          新游戏
        </button>
        <button 
          onClick={handleUndo}
          disabled={moveHistory.length === 0 || gameStatus === GAME_STATUS.PAUSED}
        >
          悔棋
        </button>
        <button 
          onClick={handlePauseResume}
          disabled={gameStatus !== GAME_STATUS.PLAYING && gameStatus !== GAME_STATUS.PAUSED}
        >
          {gameStatus === GAME_STATUS.PLAYING ? '暂停' : '继续'}
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">{modalContent.title}</h2>
            <p className="modal-message">{modalContent.message}</p>
            <div className="modal-buttons">
              <button className="primary-button" onClick={handleNewGame}>
                新游戏
              </button>
              <button className="secondary-button" onClick={() => setShowModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;