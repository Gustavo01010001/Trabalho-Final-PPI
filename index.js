import express from 'express';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();
const porta = 3000;

app.use(session({
    secret: 'chave_secreta',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 30
    }
}));

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'pages/public')));

let listaEquipes = [];

function verificarAutenticacao(req, res, next) {
    if (req.session.usuarioLogado) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

app.post('/login', (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === 'admin' && senha === '1234') {
        req.session.usuarioLogado = true;
        res.cookie('dataHoraUltimoLogin', new Date().toLocaleString(), {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true
        });
        res.redirect('/');
    } else {
        res.send(`
            <div class="container mt-5">
                <div class="alert alert-danger">Usuário ou senha incorretos.</div>
                <a href="/login.html" class="btn btn-primary">Tentar novamente</a>
            </div>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
        `);
    }
});

app.get('/logout', verificarAutenticacao, (req, res) => {
    req.session.destroy();
    res.redirect('/login.html');
});

app.get('/', verificarAutenticacao, (req, res) => {
    const dataHora = req.cookies['dataHoraUltimoLogin'] || 'Primeiro acesso';
    res.send(`
        <div class="container mt-5">
            <div class="card p-4 shadow-sm">
                <h1>Campeonato Vôlei</h1>
                <p>Último acesso: ${dataHora}</p>
                <div class="d-grid gap-2">
                    <a href="/cadastrarEquipe" class="btn btn-primary w-100 mb-2">Cadastrar Equipe</a>
                    <a href="/cadastrarJogador" class="btn btn-primary w-100 mb-2">Cadastrar Jogador</a>
                    <a href="/listar" class="btn btn-success w-100 mb-2">Listar Equipes</a>
                    <a href="/logout" class="btn btn-danger w-100">Sair</a>
                </div>
            </div>
        </div>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    `);
});

app.get('/cadastrarEquipe', verificarAutenticacao, (req, res) => {
    res.send(`
        <div class="container mt-5">
            <div class="card p-4 shadow-sm">
                <h2>Cadastrar Equipe</h2>
                <form method="POST" action="/cadastrarEquipe" class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Nome da Equipe:</label>
                        <input name="nomeEquipe" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Técnico:</label>
                        <input name="tecnico" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Telefone:</label>
                        <input name="telefone" class="form-control" required>
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">Cadastrar</button>
                        <a href="/" class="btn btn-secondary">Voltar</a>
                    </div>
                </form>
            </div>
        </div>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    `);
});

app.post('/cadastrarEquipe', verificarAutenticacao, (req, res) => {
    const { nomeEquipe, tecnico, telefone } = req.body;
    if (!nomeEquipe || !tecnico || !telefone) {
        return res.send('<p>Todos os campos são obrigatórios. <a href="/cadastrarEquipe">Voltar</a></p>');
    }
    listaEquipes.push({ nomeEquipe, tecnico, telefone, jogadores: [] });
    res.redirect('/');
});

app.get('/cadastrarJogador', verificarAutenticacao, (req, res) => {
    let options = listaEquipes.map(eq => `<option value="${eq.nomeEquipe}">${eq.nomeEquipe}</option>`).join('');
    if (!options) options = '<option disabled>Nenhuma equipe cadastrada</option>';
    res.send(`
        <div class="container mt-5">
            <div class="card p-4 shadow-sm">
                <h2>Cadastrar Jogador</h2>
                <form method="POST" action="/cadastrarJogador" class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Nome:</label>
                        <input name="nomeJogador" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Número da Camisa:</label>
                        <input type="number" name="numeroCamisa" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Data de Nascimento:</label>
                        <input type="date" name="dataNascimento" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Altura (m):</label>
                        <input type="number" name="altura" step="0.01" min="1" max="2.50" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Gênero:</label>
                        <select name="genero" class="form-select" required>
                            <option value="">Selecione</option>
                            <option>Masculino</option>
                            <option>Feminino</option>
                            <option>Outro</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Posição:</label>
                        <input name="posicao" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Equipe:</label>
                        <select name="nomeEquipe" class="form-select" required>${options}</select>
                    </div>
                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">Cadastrar</button>
                        <a href="/" class="btn btn-secondary">Voltar</a>
                    </div>
                </form>
            </div>
        </div>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    `);
});

app.post('/cadastrarJogador', verificarAutenticacao, (req, res) => {
    const { nomeJogador, numeroCamisa, dataNascimento, altura, genero, posicao, nomeEquipe } = req.body;
    if (!nomeJogador || !numeroCamisa || !dataNascimento || !altura || !genero || !posicao || !nomeEquipe) {
        return res.send('<p>Todos os campos são obrigatórios. <a href="/cadastrarJogador">Voltar</a></p>');
    }
    const equipe = listaEquipes.find(e => e.nomeEquipe === nomeEquipe);
    if (equipe) {
        if (equipe.jogadores.length < 6) {
            equipe.jogadores.push({ nomeJogador, numeroCamisa, dataNascimento, altura, genero, posicao });
            res.redirect('/');
        } else {
            res.send('<p>Equipe já tem 6 jogadores. <a href="/">Voltar</a></p>');
        }
    } else {
        res.send('<p>Equipe não encontrada. <a href="/cadastrarJogador">Voltar</a></p>');
    }
});

app.get('/listar', verificarAutenticacao, (req, res) => {
    let html = `
        <div class="container mt-5">
            <h1>Equipes e Jogadores</h1>`;
    listaEquipes.forEach(eq => {
        html += `<h3>${eq.nomeEquipe} - Técnico: ${eq.tecnico} - Tel: ${eq.telefone}</h3>
        <table class="table table-striped">
            <thead><tr><th>Nome</th><th>Camisa</th><th>Nascimento</th><th>Altura</th><th>Gênero</th><th>Posição</th></tr></thead>
            <tbody>`;
        eq.jogadores.forEach(j => {
            html += `<tr><td>${j.nomeJogador}</td><td>${j.numeroCamisa}</td><td>${j.dataNascimento}</td><td>${j.altura}m</td><td>${j.genero}</td><td>${j.posicao}</td></tr>`;
        });
        html += `</tbody></table>`;
    });
    html += `<a href="/" class="btn btn-secondary mt-3">Voltar ao Menu</a>
        </div>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">`;
    res.send(html);
});

app.listen(porta, () => {
    console.log(`Servidor no http://localhost:${porta}`);
});
