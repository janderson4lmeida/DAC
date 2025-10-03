import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://dtwqrqnvxuoextnhmbjs.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0d3FycW52eHVvZXh0bmhtYmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTY0MDQsImV4cCI6MjA3NTA5MjQwNH0.HaQXFaigtGt4psH4ycnBUcCGwBVH02MVWnfiBUbU5V4';   
// substitua (a chave é longa)

// não edite abaixo
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let funcionariosMap = {}; //objeto funcionário


async function carregarFuncionarios() {
    const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cargo, role, data_contratacao')
        .order('nome', { ascending: true });

    if (error) {
        console.error('Erro ao carregar funcionários:', error);
        alert('Erro ao carregar funcionários — veja console (F12).');
        return;
    }

    const ul = document.getElementById('lista-funcionarios');
    const sel = document.getElementById('funcionarioSelect');
    ul.innerHTML = '';
    sel.innerHTML = '';

    data.forEach(f => {
        funcionariosMap[f.id] = f;
        const li = document.createElement('li');
        li.textContent = `${f.nome} — ${f.cargo} (${f.role ?? ''})`;
        ul.appendChild(li);

        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.nome;
        sel.appendChild(opt);
    });
}

// registros
async function carregarRegistros() {
    const { data, error } = await supabase
        .from('registros_ponto')
        .select('id, funcionario_id, tipo, data_hora, observacao')
        .order('data_hora', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro ao carregar registros:', error);
        return;
    }

    const ul = document.getElementById('lista-registros');
    ul.innerHTML = '';
    data.forEach(r => {
        const nome = funcionariosMap[r.funcionario_id]?.nome ?? r.funcionario_id;
        const li = document.createElement('li');
        const when = new Date(r.data_hora).toLocaleString();
        li.textContent = `${nome} — ${r.tipo.toUpperCase()} — ${when}`;
        ul.appendChild(li);
    });
}

// registrar entrada/saida
async function registrarPonto(tipo) {
    const funcionarioId = document.getElementById('funcionarioSelect').value;
    if (!funcionarioId) { alert('Escolha um funcionário'); return; }

    const { data, error } = await supabase
        .from('registros_ponto')
        .insert([{ funcionario_id: funcionarioId, tipo, observacao: '' }]);

    if (error) {
        console.error('Erro ao inserir registro:', error);
        alert('Erro ao registrar ponto — veja console.');
    } else {
        alert('Ponto registrado!');
        carregarRegistros();
    }
}

async function testeConexao() {
    const { data, error } = await supabase.from('funcionarios').select('id').limit(1);
    console.log('testeConexao:', { data, error });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnEntrada').addEventListener('click', () => registrarPonto('entrada'));
    document.getElementById('btnSaida').addEventListener('click', () => registrarPonto('saida'));

    carregarFuncionarios().then(() => carregarRegistros());
    testeConexao();
});
