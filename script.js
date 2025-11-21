const supabase = window.supabase.createClient(
    "https://dtwqrqnvxuoextnhmbjs.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0d3FycW52eHVvZXh0bmhtYmpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTY0MDQsImV4cCI6MjA3NTA5MjQwNH0.HaQXFaigtGt4psH4ycnBUcCGwBVH02MVWnfiBUbU5V4"
);

let usuarioLogado = null;

document.getElementById("btnLogin").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, cargo_id, senha")
        .eq("email", email)
        .eq("senha", senha)
        .single();

    if (error || !data) {
        alert("Login inválido!");
        return;
    }

   
    const { senha: _, ...userData } = data;
    usuarioLogado = userData;
    abrirPainel();
});

function abrirPainel() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("painelSection").style.display = "block";
    document.getElementById("bemVindo").textContent = "Olá, " + usuarioLogado.nome;

    if (usuarioLogado.cargo_id <= 2) {
        document.getElementById("painelRH").style.display = "block";
        carregarUsuarios();
        carregarTodosRegistros();
        carregarCargos("novoCargo"); 
        carregarCargosEdicao("editCargo"); 
    }

    carregarMeusRegistros();
}

document.getElementById("btnLogout").addEventListener("click", () => {
    location.reload();
});


async function registrarPonto(tipo) {
    const { error } = await supabase.from("registros_ponto").insert([
        { usuario_id: usuarioLogado.id, tipo }
    ]);

    if (error) {
        console.error("Erro ao registrar ponto:", error);
        alert("Erro ao registrar ponto. Verifique a RLS de INSERT na tabela registros_ponto.");
        return;
    }

    carregarMeusRegistros();
}

async function carregarMeusRegistros() {
    const { data } = await supabase
        .from("registros_ponto")
        .select("tipo, data_hora")
        .eq("usuario_id", usuarioLogado.id)
        .order("data_hora", { ascending: false });

    const ul = document.getElementById("meusRegistros");
    ul.innerHTML = "";
    data?.forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.tipo} - ${new Date(r.data_hora).toLocaleString()}`;
        ul.appendChild(li);
    });
}

async function carregarUsuarios() {
    const { data } = await supabase
        .from("usuarios")
        .select("id, nome, email, cargo_id")
        .order("nome", { ascending: true });

    const ul = document.getElementById("listaUsuarios");
    ul.innerHTML = "";
    data?.forEach(u => {
        const li = document.createElement("li");
        
        li.innerHTML = `
            ${u.nome} - ${u.email} 
            <button onclick="editarUsuario(${u.id}, '${u.nome}', '${u.email}', ${u.cargo_id})">Editar</button>
            <button onclick="excluirUsuario(${u.id})">Excluir</button>`;
        ul.appendChild(li);
    });
}


async function carregarCargos(selectId, selectedCargoId = null) {
    const { data } = await supabase.from("cargos").select("*");
    const select = document.getElementById(selectId);

    
    if (selectId !== 'editCargo') {
        select.innerHTML = '<option value="" disabled selected>Selecione o Cargo</option>';
    } else {
        select.innerHTML = "";
    }

    data?.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nome;
        if (selectedCargoId !== null && c.id === selectedCargoId) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}

function carregarCargosEdicao(selectId, selectedCargoId) {
    return carregarCargos(selectId, selectedCargoId);
}



document.getElementById("btnAddUser").addEventListener("click", async () => {
    const novoCargoId = document.getElementById("novoCargo").value;

    
    if (!novoCargoId) {
        alert("Por favor, selecione um cargo para o novo usuário.");
        return;
    }

    const { error } = await supabase.from("usuarios").insert([
        {
            nome: document.getElementById("novoNome").value,
            email: document.getElementById("novoEmail").value,
            senha: document.getElementById("novoSenha").value,
            cargo_id: novoCargoId
        }
    ]);

    if (error) {
        console.error("Erro ao adicionar usuário:", error);
        alert("Erro ao adicionar usuário. Verifique se o email já está em uso ou a RLS de INSERT.");
        return;
    }

    document.getElementById("novoNome").value = "";
    document.getElementById("novoEmail").value = "";
    document.getElementById("novoSenha").value = "";
    document.getElementById("novoCargo").value = ""; 

    carregarUsuarios();
});

async function carregarTodosRegistros() {
    const { data } = await supabase
        .from("registros_ponto")
        .select("tipo, data_hora, usuarios: usuario_id ( nome )")
        .order("data_hora", { ascending: false });

    const ul = document.getElementById("todosRegistros");
    ul.innerHTML = "";

    data?.forEach(r => {
        const nome = r.usuarios?.nome || "Desconhecido";
        const li = document.createElement("li");
        li.textContent = `${nome} - ${r.tipo} - ${new Date(r.data_hora).toLocaleString()}`;
        ul.appendChild(li);
    });
}


async function excluirUsuario(usuario_id) {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) {
        return;
    }

    const { error } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuario_id);

    if (error) {
        console.error("Erro ao excluir usuário:", error);
        alert("Erro ao excluir usuário. Verifique a RLS de DELETE na tabela usuarios.");
        return;
    }

    carregarUsuarios();
    alert("Usuário excluído com sucesso!");
}


function editarUsuario(id, nome, email, cargo_id) {
    document.getElementById("edicaoUsuario").style.display = "block";
    document.getElementById("editId").value = id;
    document.getElementById("editNome").value = nome;
    document.getElementById("editEmail").value = email;
    document.getElementById("editSenha").value = "";
    carregarCargosEdicao("editCargo", cargo_id);
}


document.getElementById("btnSalvarEdicao").addEventListener("click", async () => {
    const id = document.getElementById("editId").value;
    const nome = document.getElementById("editNome").value;
    const email = document.getElementById("editEmail").value;
    const senha = document.getElementById("editSenha").value;
    const cargo_id = document.getElementById("editCargo").value;

    const updateData = { nome, email, cargo_id };
    if (senha) {
        updateData.senha = senha;
    }

    const { error } = await supabase
        .from("usuarios")
        .update(updateData)
        .eq("id", id);

    if (error) {
        console.error("Erro ao salvar edição:", error);
        alert("Erro ao salvar edição. Verifique a RLS de UPDATE na tabela usuarios.");
        return;
    }

    alert("Usuário atualizado com sucesso!");
    document.getElementById("edicaoUsuario").style.display = "none";
    carregarUsuarios();
});


document.getElementById("btnCancelarEdicao").addEventListener("click", () => {
    document.getElementById("edicaoUsuario").style.display = "none";
});