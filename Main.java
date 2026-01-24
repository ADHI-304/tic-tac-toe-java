import java.util.Scanner;

public class Main {

    static char[][] board = {
        {' ', ' ', ' '},
        {' ', ' ', ' '},
        {' ', ' ', ' '}
    };

    static char currentPlayer = 'X';

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        while (true) {
            printBoard();
            System.out.println("Player " + currentPlayer + ", enter row and column (0-2): ");
            int row = sc.nextInt();
            int col = sc.nextInt();

            if (row < 0 || row > 2 || col < 0 || col > 2) {
                System.out.println("Invalid position!");
                continue;
            }

            if (board[row][col] == ' ') {
                board[row][col] = currentPlayer;

                if (checkWin()) {
                    printBoard();
                    System.out.println("🎉 Player " + currentPlayer + " wins!");
                    break;
                }

                if (isBoardFull()) {
                    printBoard();
                    System.out.println("🤝 It's a draw!");
                    break;
                }

                currentPlayer = (currentPlayer == 'X') ? 'O' : 'X';
            } else {
                System.out.println("Cell already occupied!");
            }
        }
        sc.close();
    }

    static void printBoard() {
        System.out.println("-------------");
        for (char[] row : board) {
            System.out.print("| ");
            for (char c : row) {
                System.out.print(c + " | ");
            }
            System.out.println("\n-------------");
        }
    }

    static boolean checkWin() {
        for (int i = 0; i < 3; i++) {
            if (board[i][0] == currentPlayer &&
                board[i][1] == currentPlayer &&
                board[i][2] == currentPlayer)
                return true;

            if (board[0][i] == currentPlayer &&
                board[1][i] == currentPlayer &&
                board[2][i] == currentPlayer)
                return true;
        }

        return (board[0][0] == currentPlayer &&
                board[1][1] == currentPlayer &&
                board[2][2] == currentPlayer) ||
               (board[0][2] == currentPlayer &&
                board[1][1] == currentPlayer &&
                board[2][0] == currentPlayer);
    }

    static boolean isBoardFull() {
        for (char[] row : board)
            for (char c : row)
                if (c == ' ')
                    return false;
        return true;
    }
}
