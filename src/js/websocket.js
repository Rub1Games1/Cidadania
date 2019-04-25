  function GameController($scope) {
    var socket = io.connect();

    $scope.name = prompt("Insira o seu nome:");
    $scope.question = "Aguarde pelo administrador...";
    $scope.answers = [];
    $scope.temaMsg = "";
    $scope.temas = [];
    $scope.resposta = false;
    $scope.roster = [];

    socket.on('connect', function () {
        $scope.setName();
    });

    socket.on('gameQuestions', function(data) {
        $scope.question = data.question;
        $scope.answers = data.answers;
        $scope.$apply();
    });

    socket.on('escolherTema', function(temas) {
        console.log(temas);
        $scope.temas = temas;
        $scope.temaMsg = "Agora tens que escolher um tema!";
        $scope.$apply();
    });

    socket.on('definemsgQuestoes', function(msg) {
        $scope.question = msg;
        $scope.$apply();
    });

    socket.on('definemsgTema', function(msg) {
        $scope.temaMsg = msg;
        $scope.$apply();
    });

    socket.on('perguntas', function(data) {
        $scope.question = data.q;
        $scope.answers = data.a;
        $scope.resposta = false;

        let btns = document.getElementsByClassName('btnResposta'), idx;
        for(idx=0; idx<btns.length; idx++) {
            btns[idx].classList.remove('btn-primary');
            btns[idx].classList.remove('btn-danger');
            btns[idx].classList.remove('btn-success');
            btns[idx].disabled = false;
        }

        $scope.$apply();
    });

    socket.on('acabarPergunta', function(correta) {
        let btns = document.getElementsByClassName('btnResposta'), idx;

        for(idx=0; idx<$scope.answers.length; idx++) {
            if($scope.answers[idx] === correta)
                btns[idx].classList.add('btn-success');
            else if($scope.answers[idx] === $scope.resposta) {
                btns[idx].classList.remove('btn-primary');
                btns[idx].classList.add('btn-danger');
            }
        }

        if(correta === $scope.resposta)
            socket.emit('acertei');

        $scope.$apply();
    });

    socket.on('acabaJogo', function(arr) {
        let str = "";

        arr.forEach((val) => {
            str += `${val}\n`;
        });

        alert(`Leaderboard:\n${str}`);

        $scope.answers = [];
        $scope.$apply();
    });

    $scope.setTema = function setTema(tema) {
        socket.emit('temaEscolhido', tema);
        $scope.temas = [];
    }

    $scope.setResposta = function setResposta(res) {
        $scope.resposta = res;

        let btns = document.getElementsByClassName('btnResposta');
        for(idx=0; idx<btns.length; idx++) {
            btns[idx].disabled = true;
            if($scope.answers[idx] === res)
            btns[idx].classList.add('btn-primary');
        }
    }

    $scope.setName = function setName() {
        socket.emit('identify', $scope.name);
    };
  }