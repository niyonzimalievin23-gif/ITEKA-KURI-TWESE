
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function verifierAgent() {

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        window.location.href = "Connexion.html";
        return;
    }

    const user = userData.user;

    const { data: agent, error: agentError } =
        await supabaseClient
            .from("agents")
            .select("id, nom_complet, actif")
            .eq("auth_user_id", user.id)
            .eq("actif", true)
            .maybeSingle();

    if (agentError || !agent) {
        alert("Accès réservé à un Agent actif.");
        await supabaseClient.auth.signOut();
        window.location.href = "Connexion.html";
        return;
    }

    document.querySelector("main h3").textContent =
        "Bienvenue Agent : " + agent.nom_complet;
}

verifierAgent();

document.getElementById("btnDeconnexion").addEventListener("click", async function() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Erreur de déconnexion : " + error.message);
        return;
    }

    window.location.replace("Connexion.html");
});

document.getElementById("btnAjouterClient").addEventListener("click", function() {
    document.getElementById("formulaireClient").style.display = "block";
});

document.getElementById("btnAnnulerClient").addEventListener("click", function() {
    document.getElementById("formulaireClient").style.display = "none";
});

document.getElementById("btnEnregistrerClient").addEventListener("click", async function() {

    const code = document.getElementById("codeClient").value.trim();
    const nom = document.getElementById("nomClient").value.trim();
    const telephone = document.getElementById("telephoneClient").value.trim();
    const adresse = document.getElementById("adresseClient").value.trim();
    const numeroPiece = document.getElementById("numeroPieceClient").value.trim();
    const dateInscription = document.getElementById("dateInscriptionClient").value;

    if (!code || !nom || !telephone || !dateInscription) {
        alert("Veuillez remplir les champs obligatoires.");
        return;
    }

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        alert("Veuillez vous reconnecter.");
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        alert("Profil Agent introuvable.");
        return;
    }

    const { error } = await supabaseClient
        .from("clients")
        .insert({
            agent_id: agent.id,
            code_client: code,
            nom_complet: nom,
            telephone: telephone,
            adresse: adresse,
            numero_piece: numeroPiece,
            date_inscription: dateInscription,
            actif: true
        });

    if (error) {
        alert("Erreur : " + error.message);
        return;
    }

    alert("Client enregistré avec succès !");

    document.getElementById("codeClient").value = "";
document.getElementById("nomClient").value = "";
document.getElementById("telephoneClient").value = "";
document.getElementById("adresseClient").value = "";
document.getElementById("numeroPieceClient").value = "";
document.getElementById("dateInscriptionClient").value = "";
    document.getElementById("formulaireClient").style.display = "none";

    document.getElementById("btnVoirClients").click();
});

document.getElementById("btnVoirClients").addEventListener("click", async function() {

    const zone = document.getElementById("listeClients");
    zone.textContent = "Chargement des Clients...";

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        zone.textContent = "Veuillez vous reconnecter.";
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        zone.textContent = "Profil Agent introuvable.";
        return;
    }

    const { data: clients, error } = await supabaseClient
        .from("clients")
        .select("id, code_client, nom_complet, telephone, adresse, numero_piece, date_inscription, actif")
        .eq("agent_id", agent.id)
        .order("nom_complet", { ascending: true });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!clients || clients.length === 0) {
        zone.textContent = "Aucun Client trouvé.";
        return;
    }

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    [
        "Code Client",
        "Nom complet",
        "Téléphone",
        "Adresse",
        "Numéro pièce",
        "Date inscription",
        "Statut"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    clients.forEach(function(client) {
        const ligne = tableau.insertRow();

        [
            client.code_client,
            client.nom_complet,
            client.telephone,
            client.adresse,
            client.numero_piece,
            client.date_inscription,
            client.actif ? "Actif" : "Désactivé"
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });
    });

    zone.replaceChildren(tableau);
});
document.getElementById("rechercheClient").addEventListener("input", function() {

    const recherche = this.value.toLowerCase();
    const tableau = document.querySelector("#listeClients table");

    if (!tableau) {
        return;
    }

    const lignes = tableau.querySelectorAll("tr");

    lignes.forEach(function(ligne, index) {

        if (index === 0) {
            return;
        }

        const code = ligne.cells[0].textContent.toLowerCase();
        const nom = ligne.cells[1].textContent.toLowerCase();

        ligne.style.display =
            code.includes(recherche) || nom.includes(recherche)
                ? ""
                : "none";
    });
});

// ======================================
// CHARGER LES CLIENTS POUR EPARGNE
// ======================================

async function chargerClientsEpargne() {

    const select = document.getElementById("clientEpargne");

    select.innerHTML = '<option value="">Chargement des Clients...</option>';

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        select.innerHTML = '<option value="">Utilisateur non connecté</option>';
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        select.innerHTML = '<option value="">Agent introuvable</option>';
        return;
    }

    const { data: clients, error } = await supabaseClient
        .from("clients")
        .select("id, nom_complet")
        .eq("agent_id", agent.id)
        .eq("actif", true)
        .order("nom_complet", { ascending: true });

    if (error) {
        select.innerHTML = '<option value="">Erreur de chargement</option>';
        alert("Erreur Clients : " + error.message);
        return;
    }

    select.innerHTML = '<option value="">Sélectionner un Client</option>';

    (clients || []).forEach(function(client) {
        const option = document.createElement("option");
        option.value = client.id;
        option.textContent = client.nom_complet;
        select.appendChild(option);
    });
}

chargerClientsEpargne();

 // ======================================
 // ENREGISTRER UNE OPERATION EPARGNE
 // ======================================

document.getElementById("btnEnregistrerEpargne")
.addEventListener("click", async function() {

    const clientId = document.getElementById("clientEpargne").value;
    const typeOperation = document.getElementById("typeOperationEpargne").value;
    const montant = Number(document.getElementById("montantEpargne").value);
    const dateOperation = document.getElementById("dateEpargne").value;
    const observation = document.getElementById("observationEpargne").value;

    if (!clientId || !typeOperation || !montant || montant <= 0 || !dateOperation) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        alert("Veuillez vous reconnecter.");
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        alert("Profil Agent introuvable.");
        return;
    }

    // Vérifier le solde avant un retrait
    if (typeOperation === "RETRAIT") {

        const { data: operations, error: soldeError } = await supabaseClient
            .from("epargnes")
            .select("type_operation, montant")
            .eq("agent_id", agent.id)
            .eq("client_id", clientId);

        if (soldeError) {
            alert("Erreur de vérification du solde : " + soldeError.message);
            return;
        }

        let solde = 0;

        (operations || []).forEach(function(operation) {
 if (operation.type_operation === "DEPOT") {
                solde += Number(operation.montant);
       } else if (operation.type_operation === "RETRAIT") {
                solde -= Number(operation.montant);
            }
        });

        if (montant > solde) {
            alert("Solde insuffisant ! Solde disponible : " + solde + " BIF");
            return;
        }
    }

    const { error } = await supabaseClient
        .from("epargnes")
        .insert({
            agent_id: agent.id,
            client_id: clientId,
            type_operation: typeOperation,
            montant: montant,
            date_operation: dateOperation,
            observation: observation
        });

    if (error) {
        alert("Erreur : " + error.message);
        return;
    }

    alert("Opération enregistrée avec succès !");

    document.getElementById("montantEpargne").value = "";
    document.getElementById("dateEpargne").value = "";
    document.getElementById("observationEpargne").value = "";
    document.getElementById("typeOperationEpargne").value = "";
    document.getElementById("clientEpargne").value = "";

});
// ======================================
// AFFICHER HISTORIQUE DES EPARGNES
// ======================================

document.getElementById("btnAfficherEpargnes")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeEpargnes");

    zone.textContent = "Chargement des opérations...";

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        zone.textContent = "Veuillez vous reconnecter.";
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        zone.textContent = "Agent introuvable.";
        return;
    }

    const { data: operations, error } = await supabaseClient
        .from("epargnes")
        .select("type_operation, montant, date_operation, observation, clients(nom_complet)")
        .eq("agent_id", agent.id)
        .order("date_operation", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    zone.textContent = "";

    if (!operations || operations.length === 0) {
        zone.textContent = "Aucune opération trouvée.";
        return;
    }

    let solde = 0;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Client", "Type", "Montant", "Date"].forEach(function(titre) {
        const th = document.createElement("th");
        th.textContent = titre;
        entete.appendChild(th);
    });

    operations.forEach(function(op) {

        const ligne = tableau.insertRow();

        ligne.insertCell().textContent =
            op.clients?.nom_complet || "";

        ligne.insertCell().textContent = op.type_operation;

        ligne.insertCell().textContent =
            Number(op.montant).toLocaleString("fr-FR") + " BIF";

        ligne.insertCell().textContent =
            new Date(op.date_operation).toLocaleDateString("fr-FR");

        if (op.type_operation === "DEPOT") {
            solde += Number(op.montant);
        } else if (op.type_operation === "RETRAIT") {
            solde -= Number(op.montant);
        }
    });

    zone.appendChild(tableau);

    const resultat = document.createElement("h3");
    resultat.textContent =
        "Solde total : " + solde.toLocaleString("fr-FR") + " BIF";

    zone.appendChild(resultat);
});
// ======================================
// CHARGER LES CLIENTS POUR CREDIT
// ======================================

async function chargerClientsCredit() {

    const select = document.getElementById("clientCredit");

    select.innerHTML =
        '<option value="">Chargement des Clients...</option>';

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        select.innerHTML =
            '<option value="">Utilisateur non connecté</option>';
        return;
    }

    const { data: agent, error: agentError } =
        await supabaseClient
            .from("agents")
            .select("id")
            .eq("auth_user_id", userData.user.id)
            .eq("actif", true)
            .maybeSingle();

    if (agentError || !agent) {
        select.innerHTML =
            '<option value="">Agent introuvable</option>';
        return;
    }

    const { data: clients, error } =
        await supabaseClient
            .from("clients")
            .select("id, nom_complet")
            .eq("agent_id", agent.id)
            .eq("actif", true)
            .order("nom_complet", { ascending: true });

    if (error) {
        select.innerHTML =
            '<option value="">Erreur de chargement</option>';

        alert("Erreur Clients : " + error.message);
        return;
    }

    select.innerHTML =
        '<option value="">Sélectionner un Client</option>';

    (clients || []).forEach(function(client) {

        const option = document.createElement("option");

        option.value = client.id;
        option.textContent = client.nom_complet;

        select.appendChild(option);
    });
}

chargerClientsCredit();
// ======================================
// ENREGISTRER UN CREDIT AVEC ECHEANCES
// ======================================

document.getElementById("btnEnregistrerCredit")
.addEventListener("click", async function() {

    const clientId =
        document.getElementById("clientCredit").value;

    const montant =
        Number(document.getElementById("montantCredit").value);

    const dateCredit =
        document.getElementById("dateCredit").value;

    const duree =
        Number(document.getElementById("dureeCredit").value);

    const observation =
        document.getElementById("observationCredit").value;

    const message =
        document.getElementById("messageCredit");

    if (!clientId || montant <= 0 || !dateCredit ||
        duree <= 0 || !Number.isInteger(duree)) {

        message.textContent =
            "Veuillez remplir correctement tous les champs obligatoires.";

        return;
    }

    message.textContent = "Enregistrement du crédit en cours...";

    const { data, error } = await supabaseClient.rpc(
        "creer_credit_avec_echeances",
        {
            p_client_id: clientId,
            p_montant: montant,
            p_date_credit: dateCredit,
            p_duree: duree,
            p_observation: observation
        }
    );

    if (error) {

        message.textContent =
            "Erreur : " + error.message;

        return;
    }

    message.textContent =
        "Crédit enregistré avec succès ! Les échéances ont été créées.";

    document.getElementById("clientCredit").value = "";
    document.getElementById("montantCredit").value = "";
    document.getElementById("dateCredit").value = "";
    document.getElementById("dureeCredit").value = "";
    document.getElementById("observationCredit").value = "";

});

// ======================================
// GESTION DES REMBOURSEMENTS
// CHARGER LES CLIENTS
// ======================================

async function chargerClientsRemboursement() {

    const select = document.getElementById("clientRemboursement");

    select.innerHTML =
        '<option value="">Chargement des Clients...</option>';

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        select.innerHTML =
            '<option value="">Utilisateur non connecté</option>';
        return;
    }

    const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .eq("actif", true)
        .maybeSingle();

    if (agentError || !agent) {
        select.innerHTML =
            '<option value="">Agent introuvable</option>';
        return;
    }

    const { data: clients, error } = await supabaseClient
        .from("clients")
        .select("id, nom_complet")
        .eq("agent_id", agent.id)
        .eq("actif", true)
        .order("nom_complet", { ascending: true });

    if (error) {
        select.innerHTML =
            '<option value="">Erreur de chargement</option>';
        alert("Erreur Clients : " + error.message);
        return;
    }

    select.innerHTML =
        '<option value="">Sélectionner un Client</option>';

    (clients || []).forEach(function(client) {

        const option = document.createElement("option");

        option.value = client.id;
        option.textContent = client.nom_complet;

        select.appendChild(option);
    });
}

chargerClientsRemboursement();

// ======================================
// CHARGER LES CREDITS DU CLIENT
// ======================================

document.getElementById("clientRemboursement")
.addEventListener("change", async function() {

    const clientId = this.value;
    const selectCredit =
        document.getElementById("creditRemboursement");

    selectCredit.innerHTML =
        '<option value="">Chargement des Crédits...</option>';

    if (!clientId) {
        selectCredit.innerHTML =
            '<option value="">Sélectionner un Crédit</option>';
        return;
    }

    const { data: credits, error } = await supabaseClient
        .from("credits")
        .select("id, montant_credit, date_credit, statut")
        .eq("client_id", clientId)
        .eq("statut", "EN COURS")
        .order("date_credit", { ascending: false });

    if (error) {
        selectCredit.innerHTML =
            '<option value="">Erreur de chargement</option>';
        alert("Erreur Crédits : " + error.message);
        return;
    }

    selectCredit.innerHTML =
        '<option value="">Sélectionner un Crédit</option>';

    (credits || []).forEach(function(credit) {

        const option = document.createElement("option");

        option.value = credit.id;

        option.textContent =
            Number(credit.montant_credit).toLocaleString("fr-FR")
            + " BIF - "
            + credit.date_credit;

        selectCredit.appendChild(option);
    });

    if (!credits || credits.length === 0) {
        selectCredit.innerHTML =
            '<option value="">Aucun Crédit en cours</option>';
    }
});

// ======================================
// ENREGISTRER UN REMBOURSEMENT
// ======================================

document.getElementById("btnEnregistrerRemboursement")
.addEventListener("click", async function() {

    const creditId =
        document.getElementById("creditRemboursement").value;

    const montant = Number(
        document.getElementById("montantRemboursement").value
    );

    const date = document.getElementById("dateRemboursement").value;

    const observation =
        document.getElementById("observationRemboursement").value;

    const message =
        document.getElementById("messageRemboursement");

    if (!creditId || montant <= 0 || !date) {
        message.textContent =
            "Veuillez remplir tous les champs obligatoires.";
        return;
    }

    message.textContent = "Enregistrement en cours...";

    const { data, error } = await supabaseClient.rpc(
        "enregistrer_remboursement",
        {
            p_credit_id: creditId,
            p_montant: montant,
            p_date: date,
            p_observation: observation || null
        }
    );

    if (error) {
        message.textContent =
            "Erreur : " + error.message;
        return;
    }

    message.textContent =
        "Remboursement enregistré avec succès !";

    document.getElementById("montantRemboursement").value = "";
    document.getElementById("dateRemboursement").value = "";
    document.getElementById("observationRemboursement").value = "";

    document.getElementById("creditRemboursement").value = "";
    document.getElementById("clientRemboursement").value = "";

    document.getElementById("creditRemboursement").innerHTML =
        '<option value="">Sélectionner un Crédit</option>';

    chargerClientsRemboursement();
});

// ======================================
// BOUTON RETOUR AU TABLEAU DE BORD
// ======================================

document.getElementById("btnRetourRemboursement")
.addEventListener("click", function() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// ======================================
// GESTION DE CAISSE - AGENT
// ======================================

document.getElementById("btnVoirCaisse")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeCaisse");
    const soldeZone = document.getElementById("soldeCaisse");

    zone.textContent = "Chargement des opérations...";

    const { data: operations, error } = await supabaseClient
        .from("caisse_operations")
        .select("*")
        .order("date_operation", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    let totalEntrees = 0;
    let totalSorties = 0;

    (operations || []).forEach(function(op) {

        if (op.type_operation === "ENTREE") {
            totalEntrees += Number(op.montant);
        } else if (op.type_operation === "SORTIE") {
            totalSorties += Number(op.montant);
        }
    });

    const solde = totalEntrees - totalSorties;

    soldeZone.textContent =
        solde.toLocaleString("fr-FR") + " BIF";

    zone.innerHTML = "";

    const resume = document.createElement("div");

    resume.innerHTML = `
        <h4>Total Entrées : ${totalEntrees.toLocaleString("fr-FR")} BIF</h4>
        <h4>Total Sorties : ${totalSorties.toLocaleString("fr-FR")} BIF</h4>
        <h4>Solde : ${solde.toLocaleString("fr-FR")} BIF</h4>
    `;

    zone.appendChild(resume);

    const tableau = document.createElement("table");

    tableau.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Opération</th>
                <th>Type</th>
                <th>Montant</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = tableau.querySelector("tbody");

    (operations || []).forEach(function(op) {

        const ligne = tbody.insertRow();

        ligne.insertCell().textContent = op.date_operation;

        ligne.insertCell().textContent = op.source_type;

        ligne.insertCell().textContent = op.type_operation;

        ligne.insertCell().textContent =
            Number(op.montant).toLocaleString("fr-FR") + " BIF";
    });

    if (!operations || operations.length === 0) {
        zone.textContent = "Aucune opération de caisse.";
        return;
    }

    zone.appendChild(tableau);
});

document.getElementById("btnFermerCaisse")
.addEventListener("click", function() {

    document.getElementById("listeCaisse").innerHTML = "";

});
// ==================================
// NAVIGATION ENTRE LES MODULES AGENT
// ==================================

const boutonsNavigation = document.querySelectorAll(".menu-agent button");

const sectionsAgent = [
    "sectionClients",
    "sectionEpargnes",
    "sectionCredits",
    "sectionRemboursements",
    "sectionCaisse",
    "sectionDemandes"
];

sectionsAgent.forEach(function(id) {
    document.getElementById(id).style.display = "none";
});

boutonsNavigation.forEach(function(bouton) {

    bouton.addEventListener("click", function() {

        const sectionChoisie = bouton.dataset.section;

        sectionsAgent.forEach(function(id) {
            document.getElementById(id).style.display = "none";
        });

        document.getElementById(sectionChoisie).style.display = "block";

        boutonsNavigation.forEach(function(b) {
            b.classList.remove("actif");
        });

        bouton.classList.add("actif");
    });

});
document.getElementById("btnFermerClients")
.addEventListener("click", function() {

    document.getElementById("listeClients").innerHTML = "";

    document.getElementById("rechercheClient").value = "";

});
document.getElementById("btnVoirDemandes")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeDemandes");

    zone.textContent = "Chargement des demandes...";

    const { data: utilisateur, error: erreurAuth } =
        await supabaseClient.auth.getUser();

    if (erreurAuth || !utilisateur.user) {
        zone.textContent = "Erreur : utilisateur non connecté.";
        return;
    }

    const { data: agent, error: erreurAgent } =
        await supabaseClient
        .from("agents")
        .select("id")
        .eq("auth_user_id", utilisateur.user.id)
        .eq("actif", true)
        .single();

    if (erreurAgent || !agent) {
        zone.textContent = "Agent introuvable.";
        return;
    }

    const { data: demandes, error } = await supabaseClient
        .from("demandes_modification")
        .select("*")
        .eq("agent_id", agent.id)
        .order("date_demande", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    zone.innerHTML = "";

    if (!demandes || demandes.length === 0) {
        zone.textContent = "Aucune demande pour le moment.";
        return;
    }

    demandes.forEach(function(demande) {

        const bloc = document.createElement("div");

        const titre = document.createElement("h4");
        titre.textContent =
            demande.type_operation + " - " +
            demande.action_demandee;

        const statut = document.createElement("p");
        statut.textContent = "Statut : " + demande.statut;

        const date = document.createElement("p");
        date.textContent =
            "Date : " + new Date(demande.date_demande)
            .toLocaleString();

        bloc.appendChild(titre);
        bloc.appendChild(date);
        bloc.appendChild(statut);

        if (demande.statut === "EN ATTENTE") {

            const accepter = document.createElement("button");
            accepter.textContent = "Accepter";

            accepter.addEventListener("click", async function() {

                const { error } = await supabaseClient.rpc(
                    "repondre_demande",
                    {
                        p_demande_id: demande.id,
                        p_decision: "ACCEPTEE",
                        p_reponse: "Demande acceptée par l'Agent"
                    }
                );

                if (error) {
                    alert("Erreur : " + error.message);
                } else {
                    alert("Demande acceptée.");
                    document.getElementById("btnVoirDemandes").click();
                }
            });

            const refuser = document.createElement("button");
            refuser.textContent = "Refuser";

            refuser.addEventListener("click", async function() {

                const { error } = await supabaseClient.rpc(
                    "repondre_demande",
                    {
                        p_demande_id: demande.id,
                        p_decision: "REFUSEE",
                        p_reponse: "Demande refusée par l'Agent"
                    }
                );

                if (error) {
                    alert("Erreur : " + error.message);
                } else {
                    alert("Demande refusée.");
                    document.getElementById("btnVoirDemandes").click();
                }
            });

            bloc.appendChild(accepter);
            bloc.appendChild(refuser);
        }

        bloc.style.border = "1px solid #ccc";
        bloc.style.padding = "10px";
        bloc.style.margin = "10px 0";

        zone.appendChild(bloc);
    });

});
document.getElementById("btnFermerClients")
.addEventListener("click", function() {

    document.getElementById("listeClients").innerHTML = "";

    document.getElementById("rechercheClient").value = "";

});