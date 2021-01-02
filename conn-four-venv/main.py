import numpy as np
import math
import flask
from flask_cors import CORS
import json
import copy
import pickle

SEARCH_DEPTH = 6
WIN_VAL = 50
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

def get_best_move(board, drop_height, maximizing_player):
    valid_moves = get_valid_moves(drop_height)
    greatest_win_depth = -1
    win_index = -1
    greatest_val = -math.inf
    smallest_val = math.inf
    best_move = 0

    for action in valid_moves:
        new_board, new_drop_height = take_action(copy.deepcopy(board), copy.deepcopy(drop_height), maximizing_player, action)
        val, depth = minimax(new_board, new_drop_height, SEARCH_DEPTH - 1, -math.inf, math.inf, not maximizing_player, None, None)

        if maximizing_player and val == WIN_VAL:
            if depth > greatest_win_depth:
                greatest_win_depth = depth
                win_index = action
        elif (not maximizing_player) and val == -WIN_VAL:
            if depth > greatest_win_depth:
                greatest_win_depth = depth
                win_index = action
        elif maximizing_player:
            altered = val - (abs(3 - action) + (len(board) - drop_height[action]) // 2)
            if altered > greatest_val:
                greatest_val = altered
                best_move = action
        else:
            altered = val + (abs(3 - action) + (len(board) - drop_height[action]) // 2)
            if altered < smallest_val:
                smallest_val = altered
                best_move = action
                
    if win_index != -1:
        return win_index
    else:
        return best_move
    
def minimax(board, drop_height, depth, alpha, beta, maximizing_player, last_board, last_action):
    if last_board != None:
        board_int = board_to_int_fast(last_board, last_action, not maximizing_player)
    else:
        board_int = board_to_int(board)

    val = HASHES.get(board_int, None)

    if val == None:
        val = evaluate(board)
        HASHES[board_int] = val
    
    if depth == 0 or val == WIN_VAL or val == -WIN_VAL:
        return val, depth
    
    if maximizing_player:
        max_eval = -math.inf
        selected_depth = 0

        for action in get_valid_moves(drop_height):
            board_copy = copy.deepcopy(board)
            drop_height_copy = copy.deepcopy(drop_height)

            new_board, new_drop_height = take_action(board_copy, drop_height_copy, maximizing_player, action)
            this_val, eval_depth = minimax(new_board, new_drop_height, depth - 1, alpha, beta, False, board_int, action)
            
            if this_val > max_eval:
                max_eval = this_val
                selected_depth = eval_depth

            alpha = max([alpha, max_eval])
            if beta <= alpha:
                break

        return max_eval, selected_depth
    else:
        min_eval = math.inf
        selected_depth = 0

        for action in get_valid_moves(drop_height):
            board_copy = copy.deepcopy(board)
            drop_height_copy = copy.deepcopy(drop_height)

            new_board, new_drop_height = take_action(board_copy, drop_height_copy, maximizing_player, action)
            this_val, eval_depth = minimax(new_board, new_drop_height, depth - 1, alpha, beta, True, board_int, action)

            if this_val < min_eval:
                min_eval = this_val
                selected_depth = eval_depth

            beta = min([beta, min_eval])
            if beta <= alpha:
                break
            
        return min_eval, selected_depth

def evaluate(board):
    three_score = 0
    threats = np.zeros((6,7))
    
    # Horizontal win check
    for val in [-1, 1]:
        for i in range(len(board[0]) - 3):
            for k in range(len(board)):

                if(board[k][i] == val and board[k][i] == board[k][i + 1] and board[k][i + 1] == board[k][i + 2] and board[k][i + 2] == board[k][i + 3]):
                    return WIN_VAL * val

                if((board[k][i] == val and board[k][i] == board[k][i + 1] and board[k][i + 1] == board[k][i + 2] and board[k][i + 3] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k][i + 1] and board[k][i + 1] == board[k][i + 3] and board[k][i + 2] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k][i + 2] and board[k][i + 2] == board[k][i + 3] and board[k][i + 1] == 0) or 
                    (board[k][i + 1] == val and board[k][i + 1] == board[k][i + 2] and board[k][i + 2] == board[k][i + 3] and board[k][i] == 0)):
                    three_score += val * (k // 2)

                    if k < 5:
                        for j in range(4):
                            if board[k + 1][i + j] == 0:
                                threats[k][i + j] = val

    # Vertical win check
    for val in [-1, 1]:            
        for i in range(len(board[0])):
            for k in range(len(board) - 3):

                if(board[k][i] == val and board[k][i] == board[k + 1][i] and board[k + 1][i] == board[k + 2][i] and board[k + 2][i] == board[k + 3][i]):
                    return WIN_VAL * val

                if((board[k][i] == val and board[k][i] == board[k + 1][i] and board[k + 1][i] == board[k + 2][i] and board[k + 3][i] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 1][i] and board[k + 1][i] == board[k + 3][i] and board[k + 2][i] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 2][i] and board[k + 2][i] == board[k + 3][i] and board[k + 1][i] == 0) or 
                    (board[k + 1][i] == val and board[k + 1][i] == board[k + 2][i] and board[k + 2][i] == board[k + 3][i] and board[k][i] == 0)):
                    three_score += val
                    
    # TL to BR win check
    for val in [-1, 1]:
        for i in range(len(board[0]) - 3):
            for k in range(len(board) - 3):

                if(board[k][i] == val and board[k][i] == board[k + 1][i + 1] and board[k + 1][i + 1] == board[k + 2][i + 2] and board[k + 2][i + 2] == board[k + 3][i + 3]):
                    return WIN_VAL * val

                if((board[k][i] == val and board[k][i] == board[k + 1][i + 1] and board[k + 1][i + 1] == board[k + 2][i + 2] and board[k + 3][i + 3] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 1][i + 1] and board[k + 1][i + 1] == board[k + 3][i + 3] and board[k + 2][i + 2] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 2][i + 2] and board[k + 2][i + 2] == board[k + 3][i + 3] and board[k + 1][i + 1] == 0) or 
                    (board[k + 1][i + 1] == val and board[k + 1][i + 1] == board[k + 2][i + 2] and board[k + 2][i + 2] == board[k + 3][i + 3] and board[k][i] == 0)):
                    three_score += val
                    if k < 2:
                        for j in range(4):
                            if board[k + 1 + j][i + j] == 0:
                                threats[k + j][i + j] == val
                                
                    if board[k][i] == 0:
                        threats[k][i] = val
                    elif k > 0 and i > 0:
                        if board[k - 1][i - 1] == 0 and board[k][i - 1] == 0:
                            threats[k - 1][i - 1] = val
                    
    # TR to BL win check           
    for val in [-1, 1]:
        for i in range(len(board[0]))[3::]:
            for k in range(len(board) - 3):

                if(board[k][i] == val and board[k][i] == board[k + 1][i - 1] and board[k + 1][i - 1] == board[k + 2][i - 2] and board[k + 2][i - 2] == board[k + 3][i - 3]):
                    return WIN_VAL * val

                if((board[k][i] == val and board[k][i] == board[k + 1][i - 1] and board[k + 1][i - 1] == board[k + 2][i - 2] and board[k + 3][i - 3] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 1][i - 1] and board[k + 1][i - 1] == board[k + 3][i - 3] and board[k + 2][i - 2] == 0) or 
                    (board[k][i] == val and board[k][i] == board[k + 2][i - 2] and board[k + 2][i - 2] == board[k + 3][i - 3] and board[k + 1][i - 1] == 0) or 
                    (board[k + 1][i - 1] == val and board[k + 1][i - 1] == board[k + 2][i - 2] and board[k + 2][i - 2] == board[k + 3][i - 3] and board[k][i] == 0)):
                    three_score += val

                    if k < 2:
                        for j in range(4):
                            if board[k + 1 + j][i - j] == 0:
                                threats[k + j][i - j] == val

                    if board[k][i] == 0:
                        threats[k][i] = val
                    elif k > 0 and i < 6:
                        if board[k - 1][i + 1] == 0 and board[k][i + 1] == 0:
                            threats[k - 1][i + 1] = val
    
    threat_score = 0
    for i in range(len(board[0])):
        this_col = 0
        col_ind = 0
        multiplier = 1
        for k in range(len(board)):
            if threats[k][i] != 0 and this_col == 0:
                this_col = threats[k][i]
                col_ind = k
                
            if threats[k][i] == -1 and this_col == -1:
                if ((k - col_ind) % 2) == 1:
                    multiplier = MULTI_THREAT_VAL
                else:
                    multiplier = SINGLE_THREAT_VAL
                
            if threats[k][i] == 1 and this_col == 1:
                if ((k - col_ind) % 2) == 1:
                    multiplier = MULTI_THREAT_VAL
                else:
                    multiplier = SINGLE_THREAT_VAL
                
            if threats[k][i] == 1 and this_col == -1:
                this_col = 1
                multiplier = SINGLE_THREAT_VAL
                
            if threats[k][i] == -1 and this_col == 1:
                this_col = -1
                multiplier = SINGLE_THREAT_VAL
        threat_score += this_col * multiplier   
            
    return three_score + threat_score

def check_tie(drop_height):
    tie = True
    for num in drop_height:
        if num >= 0:
            tie = False
            break
    return tie

def player_one_win_percentage(board, drop_height, depth, maximizing_player):
    new_board = copy.deepcopy(board)
    new_drop_height = copy.deepcopy(drop_height)
    
    val, depth = minimax(new_board, new_drop_height, depth, -math.inf, math.inf, maximizing_player, None, None)
    
    p_one_percent = clamp(50 + (val * 2), 0, 100)
    return p_one_percent

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

def write_hashes(hashes):
    with open(FILENAME, "wb") as f:
        pickle.dump(hashes, f)

FILENAME = "val_hashes.p"
HASHES = {}
with open(FILENAME, "rb") as f:
    unpickler = pickle.Unpickler(f)
    try:
        HASHES = unpickler.load()
    except EOFError:
        print(FILENAME + " is empty.")

app = flask.Flask(__name__)
CORS(app)

@app.route('/percent', methods=['POST'])
def get_percent():
    data = flask.request.get_json()

    board = json.loads(data['board'])
    drop_height = calculate_drop_height(board)
    player = get_turn(board)
    percent = player_one_win_percentage(board, drop_height, SEARCH_DEPTH, player)
    move = get_best_move(board, drop_height, player)
    
    write_hashes(HASHES)

    return json.dumps({"percent": percent, "best": move})

if __name__ == '__main__':
    app.run()