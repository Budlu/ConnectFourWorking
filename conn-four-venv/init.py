import numpy as np
import math
import flask
import json
import copy
import pickle

SEARCH_DEPTH = 6
WIN_VAL = 200
SINGLE_THREAT_VAL = 5
MULTI_THREAT_VAL = 20

SEARCH_PRIORITY = [3, 4, 2, 5, 1, 6, 0]

def get_valid_moves(drop_height):
    valid_moves = []
    for action in SEARCH_PRIORITY:
        if(drop_height[action] >= 0):
            valid_moves.append(action)
    return valid_moves

def take_action(this_board, this_drop_height, maximizing_player, action):
    this_board[this_drop_height[action]][action] = maximizing_player - (not maximizing_player)
    this_drop_height[action] -= 1
    return this_board, this_drop_height
    
def minimax(board, drop_height, depth, alpha, beta, maximizing_player, last_board, last_action):
    moves = get_valid_moves(drop_height)
    if moves == []:
        return 0, 0, 0

    if last_board != None:
        board_int = board_to_int_fast(last_board, last_action, not maximizing_player)
    else:
        board_int = board_to_int(board)

    val = HASHES.get(board_int, None)

    if val == None:
        val = evaluate(board)
        HASHES[board_int] = int(val)
    
    if depth == 0 or abs(val) == WIN_VAL:
        return val, depth, 0
    
    if maximizing_player:
        max_eval = -math.inf
        selected_depth = -1
        selected_action = 0

        for action in moves:
            board_copy = copy.deepcopy(board)
            drop_height_copy = copy.deepcopy(drop_height)

            new_board, new_drop_height = take_action(board_copy, drop_height_copy, maximizing_player, action)
            this_val, eval_depth, last_best_action = minimax(new_board, new_drop_height, depth - 1, alpha, beta, False, board_int, action)

            if this_val == WIN_VAL:
                if this_val > max_eval or eval_depth > selected_depth:
                    selected_depth = eval_depth
                    max_eval = this_val
                    selected_action = action
            elif this_val > max_eval:
                max_eval = this_val
                selected_depth = eval_depth
                selected_action = action

            alpha = max([alpha, max_eval])
            if beta <= alpha:
                break

        return max_eval, selected_depth, selected_action
    else:
        min_eval = math.inf
        selected_depth = -1
        selected_action = 0

        for action in moves:
            board_copy = copy.deepcopy(board)
            drop_height_copy = copy.deepcopy(drop_height)

            new_board, new_drop_height = take_action(board_copy, drop_height_copy, maximizing_player, action)
            this_val, eval_depth, last_best_action = minimax(new_board, new_drop_height, depth - 1, alpha, beta, True, board_int, action)

            if this_val == -WIN_VAL:
                if this_val < min_eval or eval_depth > selected_depth:
                    selected_depth = eval_depth
                    min_eval = this_val
                    selected_action = action
            elif this_val < min_eval:
                selected_depth = eval_depth
                min_eval = this_val
                selected_action = action

            beta = min([beta, min_eval])
            if beta <= alpha:
                break
            
        return min_eval, selected_depth, selected_action

def evaluate(board):
    evaluation = 0
    threats = np.zeros((6,7))

    # Horizontal checks
    for i in range(len(board)):
        for k in range(len(board[0]) - 3):
            s = np.sum(board[i,k:k+4])
            absS = abs(s)
            sign = np.sign(s)

            if absS == 4:
                return WIN_VAL * sign
            elif absS == 3:
                evaluation += sign * (i // 2)

                if i < 5:
                    for j in range(4):
                        if board[i + 1][k + j] == 0:
                            threats[i][k + j] = sign

    # Vertical checks     
    for i in range(len(board) - 3):
        for k in range(len(board[0])):
            s = np.sum(board[i:i+4,k])
            absS = abs(s)
            sign = np.sign(s)

            if absS == 4:
                return WIN_VAL * sign
            elif absS == 3:
                evaluation += sign
                    
    # TL to BR checks
    for i in range(len(board) - 3):
        for k in range(len(board[0]) - 3):
            s = np.sum([board[i][k], board[i + 1][k + 1], board[i + 2][k + 2], board[i + 3][k + 3]])
            absS = abs(s)
            sign = np.sign(s)

            if absS == 4:
                return WIN_VAL * sign
            elif absS == 3:
                evaluation += sign

                r = 4 if i < 2 else 3

                for j in range(r):
                    if board[i + j + 1][k + j] == 0:
                        threats[i + j][k + j] = sign
                    
    # TR to BL checks
    for i in range(len(board) - 3):
        for k in range(3, len(board[0])):
            s = np.sum([board[i][k], board[i + 1][k - 1], board[i + 2][k - 2], board[i + 3][k - 3]])
            absS = abs(s)
            sign = np.sign(s)

            if absS == 4:
                return WIN_VAL * sign
            elif absS == 3:
                evaluation += sign

                r = 4 if i < 2 else 3

                for j in range(r):
                    if board[i + j + 1][k - j] == 0:
                        threats[i + j][k - j] = sign

    # Threat evaluation
    for k in range(len(board[0])):
        this_col = -1
        col_ind = 0
        multiplier = 0

        for i in range(len(board)):
            if threats[i][k] == 0:
                continue
            elif this_col == -1:
                this_col = threats[i][k]
                col_ind = i
                multiplier = SINGLE_THREAT_VAL
            elif threats[i][k] == this_col:
                if ((i - col_ind) % 2) == 1:
                    multiplier = MULTI_THREAT_VAL
                else:
                    multiplier = SINGLE_THREAT_VAL
            else:
                this_col = threats[i][k]
                multiplier = SINGLE_THREAT_VAL

        evaluation += this_col * multiplier   
            
    return evaluation

def check_tie(drop_height):
    tie = True
    for num in drop_height:
        if num >= 0:
            tie = False
            break
    return tie

def calculate_drop_height(board):
    ret_val = []
    height = len(board) - 1
    for k in range(len(board[0])):
        appended = False
        for i in range(height + 1):
            if board[height - i][k] == 0:
                ret_val.append(height - i)
                appended = True
                break
        if not appended:
            ret_val.append(-1)
            
    return ret_val
            
def clamp(val, _min, _max):
    if (val > _max):
        return _max
    elif (val < _min):
        return _min
    else:
        return val

def get_turn(board):
    one_count = 0
    two_count = 0
    for i in range(len(board)):
        for k in range(len(board[0])):
            if board[i][k] == 1:
                one_count += 1
            elif board[i][k] == -1:
                two_count += 1
    return one_count == two_count

def calculate_drop_height_modified(board):
    ret_val = []
    height = len(board)
    for k in range(len(board[0])):
        appended = False
        for i in range(height):
            if board[height - i - 1][k] == 0:
                ret_val.append(height - i)
                appended = True
                break
        if not appended:
            ret_val.append(0)
    return ret_val

def board_to_int(board):
    ret_str = ""
    drop_height = calculate_drop_height_modified(board)
    
    for height in drop_height:
        ret_str += bin(height)[2:].zfill(3)

    for i in range(len(board)):
        for k in range(len(board[0])):
            if board[i][k] == -1:
                ret_str += '1'
            else:
                ret_str += '0'
    
    return int(ret_str, 2)

def board_to_int_fast(last_board, action, player):
    binary = bin(last_board)[2:].zfill(63)
    current_height = binary[action*3:action*3+3]
    current_height = int(current_height, 2)
    current_height -= 1
    current_height = bin(current_height)[2:].zfill(3)

    new_str = binary[0:action*3] + current_height + binary[action*3+3:]
    ret_val = int(new_str, 2)

    if not player:
        pos = int(current_height, 2) * 7 + action
        ret_val ^= 1 << (41 - pos)
    
    return ret_val

FILENAME = "val_hashes.p"
HASHES = {}
with open(FILENAME, "rb") as f:
    unpickler = pickle.Unpickler(f)
    try:
        HASHES = unpickler.load()
    except EOFError:
        print(FILENAME + " is empty.")

app = flask.Flask(__name__)

@app.route('/', methods=['GET'])
def main():
    return flask.render_template("index.html", token="token")

@app.route('/projects/connect')
def connect():
    return flask.render_template("index.html", token="token")

@app.route('/percent', methods=['POST'])
def get_percent():

    try:
        data = flask.request.get_json()

        board = np.array(data)
        drop_height = calculate_drop_height(board)
        player = get_turn(board)

        val, eval_depth, move = minimax(board, drop_height, SEARCH_DEPTH, -math.inf, math.inf, player, None, None)
        percent = clamp(50 + (val * 2), 0, 100)

        return json.dumps({"percent": int(percent), "best": move})
    except:
        print("Invalid post data")

if __name__ == '__main__':
    app.run()