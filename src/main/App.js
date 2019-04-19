/**
 * Importação dos módulos a serem utilizados nesse arquivo JS
 */
import React, { Component } from 'react';//React e classe Component, necessários para se criar um component que possa ser interpretado pelo React
import Graph from 'react-graph-vis';//React-graph-vis, Componente do criado para exibir grafos do Vis em React. https://github.com/crubier/react-graph-vis
import Menu from '../components/menu';//Componente Menu, utilizado para exibir o menu de contexto
import FormModal from '../components/modal'; //Componente modal, utilizado para editar ou adicionar um nó
import ModalEdge from '../components/modalEdge';// Componente ModalEdge, utilizado para adicionar ou editar uma aresta
import Formulario from '../components/formulario';//Componente Formulário, utilizado para informar o recurso que será carregado na visualização
import axios from 'axios';//Biblioteca Axios, utilizada para fazer requisições Ajax em outros servidores
import query from '../query'//Texto que será utilizado na consulta SPARQL/SNORQL;


/**
 * Criando a constante namespaces, que é um array literal. Onde a chave é a url do local e o valor é o tipo
 * Essa informação é utilizada para montar de forma amigável os "PREFIX" da consulta SPARQL/SNORQL
 * Esse formto é baseado na análise de comportamento da página http://dbpedia.org/snorql/
 */
const namespaces = {
  'http://www.w3.org/2002/07/owl#': 'owl',
  'http://www.w3.org/2001/XMLSchema#': 'xsd',
  'http://www.w3.org/2000/01/rdf-schema#': 'rdfs',
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#': 'rdf',
  'http://xmlns.com/foaf/0.1/': 'foaf',
  'http://purl.org/dc/elements/1.1/': 'dc',
  'http://dbpedia.org/resource/': '',
  'http://dbpedia.org/property/': 'dbpedia2',
  'http://dbpedia.org/': 'dbpedia',
  'http://www.w3.org/2004/02/skos/core#': 'skos'
};

/**
 * Inicialização do objeto de graph do vis
 */
const graph = {
  nodes: [
    //estutura do node, ID, nome e cor
 
  ],

  edges: 
  
        [
    //Estrutura das ligações: (de > para , texto da ligação e o alinhamento do mesmo)
       
        ] 
};

/**
 * Criação do objeto de opções de configuração do vis conforma documentação no endereço:
 * http://visjs.org/docs/network/#options
 */
const options = {
  layout: {
    randomSeed: undefined,
    improvedLayout:true,
    hierarchical: {
      enabled:false,
      levelSeparation: 150,
      nodeSpacing: 100,
      treeSpacing: 200,
      blockShifting: true,
      edgeMinimization: true,
      parentCentralization: true,
      direction: 'UD',        // UD, DU, LR, RL
      sortMethod: 'hubsize'   // hubsize, directed
    }
  },
  edges: {
    color: "#000000",
    "smooth": {
      "type": "dynamic",
      "roundness": 0.2
    }
  },
  locale:'pt-br',
  groups:{},
  "physics": {
    "barnesHut": {
      "gravitationalConstant": -27050,
      "centralGravity": 0,
      "springConstant": 0.055
    },
    "maxVelocity": 52,
    "minVelocity": 0.26,
    "timestep": 0.73
  }
};


/**
 * Criação do componente App
 * Por se tratar de um componente de alta complexidade, foi criado em formto de classe
 * Para se tornar um componente, a classe deve fazer um extend da classe Component do React
 */
class App extends Component {
  /**
   * Constructor da classe
   */
  constructor(){
    /**
     * invocando o método super para fazer a chamada do constructor da classe Component
     */
    super();

    /**
     * Fazendo a inicialização do state do componente
     * O state é o atributo que ao ser modificado, irá chamar o método render() do componente, que atualizará as informações da tela;
     * logo, ele deve ser inicializado com todos os atributos no Constructor
     */
    this.state={
      graph,
      options,
      network : {},
      menu : {},
      itensMenu: [],
      modal: false,
      modalEdge: false,
      editingNode:{
        id:'',
        label:'',
        color:'',
        point_to:[0],
        pointed_by:[0]
      },
      editingEdge:{
        id:'',
        label:'',
        align:'',
      }
    }

    /**
     * fazendo o Bind dos métodos que serão chamados em outros ocomponentes.
     * O Bind é um padrão adotado pelos usuários do React para mapear uma classe principal dentro do método, quando o mesmo é chamado dentro de um componente inferior
     * Sendo assim, dentro do método, a chamada ao "this", irá acessar a classe App e não o componente em que o método é chamado ().
     */
    this.salvar = this.salvar.bind(this);
    this.salvarEdge = this.salvarEdge.bind(this);
    this.getNetwork = this.getNetwork.bind(this);
    this.removeNode = this.removeNode.bind(this);
    this.toggle = this.toggle.bind(this);
    this.toggleEdge = this.toggleEdge.bind(this);
    this.openNodeForm = this.openNodeForm.bind(this);
    this.editar = this.editar.bind(this);
    this.editarEdge = this.editarEdge.bind(this);
    this.carregar = this.carregar.bind(this);
    this.resetar = this.resetar.bind(this);
  }

  /**
   * Método que atualiza o estado da aplicação com valores vazios, ou seja, limpa o grapho
   */
  resetar(){
    let nodes = [];
    let edges = [];


    this.setState({
      graph:{
        edges, nodes
      }
    })  
  }

  /**
   * Método que retorna um objeto com os eventos do grapho, conforme a documentação do Vis: http://visjs.org/docs/network/#Events
   * Ou seja, são definidas as funções que serão executadas ao se clicar duas vezes, ou clicar com o botão direito, selecionar um nó etc...
   */
  getEvents() {
    return {
      /**
       * Definindo ação a ser executada ao clicar no grapho. Foi definido que ao efetuar um clique simples, nada poderá ocorrer no grapho.
       */
      click: (e) =>{
      },
      /**
       * Definindo ação a ser executada ao se clicar com o botão direito do mouse
       */
      oncontext: (event) =>{
        /**
         * Acessando o atributo network do estado.
         * network é o objeto do grafo gerado pelo vis. Com este objeto, é possível identificar o nó ou a aresta que recebeu o clique,
         * utilizando os metodos getNodeAt e getEdgeAt, passando como parametro a posição do ponteiro do mouse no momento do clique, que pode ser obtido
         * através do objeto event que é recebido como parametro no evento oncontext.
         */
        let {network} = this.state;
        let node = network.getNodeAt(event.pointer.DOM);
        let edge = network.getEdgeAt(event.pointer.DOM);
        /**
         * inicialização do array itensMenu, que irá armazenar as opções que serão exibidos no menu ao se clicar com o botão direito no grafo.
         */
        let itensMenu = [];
       
        /**
         * Método do objeto de evento que impede a exibição do menu de contexto padrão do navegador.
         * É necessário para que ao invés de exibir o menu padrão, seja exibido o menu personalizado da aplicação
         */
        event.event.preventDefault();

        /**
         * Verificando se o que foi clicado é um nó ou uma aresta. A verificação é feita para definir os itens que irão compor o menu
         * Os itens são adquiridos através do método getItensMenu
         */
        if(node !== undefined){
          itensMenu = this.getItensMenu('node', node);
        }else if(edge !== undefined){
          itensMenu = this.getItensMenu('edge', edge);
        }else{
          itensMenu = this.getItensMenu('');
        }
        
        /**
         * Atualizando o estado do componente com os itens do menu a ser exibido
         */
        this.setState({
          itensMenu
        });

        /**
         * Método que exibe o menu de contexto. Recebe como parametros as coordenadas do mouse, local onde será exibido.
         */
        this.showMenu(event.event.x, event.event.y)

        /**
         * impede que o menu de contexto do vis seja exibido
         */
        return false;
      },
      /**
       * Definindo ação a ser executada ao realizar um duplo clique no Grafo
       */
      doubleClick:(e) => {
        /**
         * Verifica se o duplo clique foi feito em um nó
         * Caso positivo, ele busca no estado as informações do nó clicado, 
         * e em seguida busca os nós ligados a este no via consulta para atualizar o grafo
         * Caso contrário, ou seja, o objeto clicado for uma aresta, é feito o agrupamento pela aresta através do método agruparEdges
         */
        if(e.nodes.length !== 0){
          const nodes = [...this.state.graph.nodes];
          let node = {};
          this.hideMenu();
          
          /**
           * varrendo o estado em busca do nó clicado, par assim obter o label e o valor do nó
           */
          nodes.forEach(item => {
            if(item.id === e.nodes[0]){
              node = {...item};
            }
          });
          
          /**
           * utiliza o label e o valor do nó para efetuar uma nova pesquisa atualizando o grafo
           * esta ação é feita pelo método getNodes
           */
          this.getNodes(node.value, node.label);
        }else{
          this.agruparEdges(e.edges[0]);
        }
      },
      /**
       * Definindo ação a ser executada quando se selecionar um nó
       * Verifica se o nó está agrupado, e caso positivo, faz o desacoplamento dos nós
       */
      selectNode:(params)=>{
        let {network} = this.state;
        if (params.nodes.length === 1) {

          if (network.isCluster(params.nodes[0]) === true) {
              network.openCluster(params.nodes[0]);
          }
        } 
      }
    }
  }

  /**
   * Essa função é chamada dentro do  react-graph-vis para se ter acesso ao objeto network criado pelo Vis.
   * Desta forma, a função criada atualiza o network no estado da aplicação
   */
  getNetwork(network){
    this.setState({network})
  }

  /**
   * Limpa os estados referentes ao formulário de atualização de nós e arestas
   */
  limpar(){
    let state = {...this.state};
    state.editingNode = {
      id:'',
      label:'',
      color:'',
      point_to:[0],
      pointed_by:[0]
    }
    
    state.editingEdge = {
      id:'',
      label:'',
      align:'',
    }

    this.setState(state)    
  }

  /**
   * Método que exibe o menu de contexto
   */
  showMenu(x,y){
    let {menu} = this.state;

    menu.top        = y + "px";
    menu.left       = x + "px";
    menu.visibility = "visible";
    menu.opacity    = "1";
  }
  
  /**
   * Método que esconde o menu contexto
   */
  hideMenu(){
    let {menu} = this.state;
    menu.opacity = "0";
    setTimeout(function() {
      menu.visibility = "hidden";
    }, 501);
  
  }


  /**
   * Método que retorna os itens a serem exibidos no menu de contexto
   * O método identifica o elemento clicado recebido por parametro e através da validação retorna um array com um objeto representando as ações do menu de contexto.
   */
  getItensMenu(element, id = null){
    let itens = [];
    
    if(element === 'node'){
      itens.push({
       // text: 'Editar nó selecionado',
        text: 'Edit selected Node',
        icon: 'fa-edit',
        action: this.editar,
        id: id
      });
      itens.push({
        text: 'Delet the selected Node',
        icon: 'fa-trash',
        id:id,
        action: this.removeNode
      });
    }else if(element === 'edge'){
      itens.push({
        text: 'Edit edge´s Label',
        icon: 'fa-pen',
        action:this.editarEdge,
        id:id
      });
    }else{
      itens = [{
        text:'Add a new Node',
        icon:'fa-plus',
        action:this.openNodeForm
      }]
    }

    return itens;
  }

  /**
   * Trata os valores do formalário que são provenientes de um multiselect
   */

  getSelectValues(field){
    return Array.prototype.map.apply(
      field.selectedOptions, 
      [function (option) {
        return option.value
      }]
    )
  }

  /**
   * Trata os valores do formulário para retornar um objeto com os dados a serem salvos
   */
  getFormValues (form) {
    return Object.values(form).reduce((obj,field) => { 
      if(field.type !== 'submit' && field.type !== undefined){
        obj[field.name] = field.type ==='select' || field.type === 'select-multiple' ? this.getSelectValues(field) :field.value; 
        return obj 
      }else{
        return obj
      }
    }, {})
  }

  /** 
   * método para criação de nova aresta. 
   * Recebe como parametro o idetificador do nó a ser salvo, um array point_to com os ids do nó que serão apontados pelo nó anterior e 
   * um array pointed_by com os ids dos nós que apontam para o nó anterior
   */
  getNewEdges (id, point_to, pointed_by ){
    const edges = [...this.state.graph.edges];
    let label = '<<Connection>>';
    let font = {align: 'bottom'}
    
    /** 
     * Varre o array de nós a serem apontados para criar uma aresta em cada iteração e adiciona-la no array de arestas
     */
    point_to.forEach(element => {
      edges.push({from: id, to:parseInt(element, 10), label,font})
    });

    /** 
     * Varre o array de nós que apontam para o nó a ser salvo para criar uma aresta em cada iteração e adiciona-la no array de arestas 
     */
    pointed_by.forEach(element => {
      edges.push({from: parseInt(element, 10), to:id, label, font})
    });


    return edges;
  }

  /**
   * Método para retornar o maior identificador dos nós do grafo para posteriormente ser utilizado em um novo nó
   */
  getMaxId () {
    let nodes = [...this.state.graph.nodes];
    /**
     * retorna 0 caso o array de nós esteja vazio, ou ordena os ids em ordem decrescente e retorna o primeiro registro + 1
     */
    return nodes.length > 0 ? nodes.sort((a,b) => b.id - a.id)[0].id + 1 : 1;    
  }

  /** 
   * método para remover o node. Recebe como parametro o identificador do nó a ser removido
  */
  removeNode(id){
    if(id){
      const edges = [...this.state.graph.edges];
      const nodes = [...this.state.graph.nodes];
      const newNodes = [];
      const newEdges = [];

      /** 
       * Itera o array de nós e preenche um novo array com os nós diferentes do nó selecionado
       */
      nodes.forEach((node)=>{
        if(node.id !== parseInt(id, 10)){
          newNodes.push(node);
        }
      })

      /** 
       * Itera sobre o array de arestas e preenche um novo array de arestas com as arestas que não apontam e não são apontadas pelo nó a ser removido
       */
      edges.forEach((edge)=>{
        if(edge.to !== parseInt(id,10) && edge.from !== parseInt(id,10)){
          newEdges.push(edge);
        }
      })

      /** 
       * Atualiza o edtado da aplicação com os novos arrays de aresta e nós
       */
      this.setState({
        graph:{
          nodes:newNodes, edges:newEdges
        }
      })
    }
    this.hideMenu();

  }

  /**
   * Método para abrir o formulário para preenchimento dos dados do nó
   */
  openNodeForm(){
    this.limpar();
    /** 
     * Chamada do método toggle, utilizado para abrir ou fechar o modal
     */
    this.toggle();
    this.hideMenu();
  }

  /** 
   * Método para edição do nó, recebe como parametro o identificador do nó
   * 
   */
  editar(id){
    let nodes = [...this.state.graph.nodes];
    let edges = [...this.state.graph.edges];
    let node = {};
    
    /**
     * Itera sobre o array de nós para encontrar o nó com o id informado.
     * Ao encontrar o no desejado, os atributos desse nó são passados para uma nova variável
     */
    nodes.forEach(item => {
      if(item.id === id){
        node = {...item};
      }
    });


    node.pointed_by = [];
    node.point_to = [];

    /**
     * Iteração sobre o array de arestas para preencher os arrays de arestas ligados ao nó a ser editado
     */
    edges.forEach( item => {
      if(item.to === id){
        node.pointed_by.push(item.from)
      }
      if(item.from === id){
        node.point_to.push(item.to)
      }
    })

    /**
     * Atualiza o estado com o nó que está sendo editado
     */
    this.setState({
      editingNode : node
    })

    this.toggle();
    this.hideMenu();
  }
  
  /**  
   * Método para editar uma aresta selecionada
  */
  editarEdge(id){
    let edges = [...this.state.graph.edges];
    let edge = {};
    
    /** 
     * Itera o array de arestas para preencher uma variável com os atributos da aresta selecionada
     */
    edges.forEach(item => {
      if(item.id === id){
        edge = {...item};
      }
    });

    /**
     * Atualiza o estado com a aresta a ser editada
     */    
    this.setState({
      editingEdge : {
        id,
        label:edge.label,
        align:edge.font.align,
      }
    })

    this.toggleEdge();
    this.hideMenu();

  }

  /** 
   * Método para agrupar os nós através da aresta.
   * É chamado no evento de duplo clique
   * Recebe como parametro o identificador da aresta usada para o agrupamento.
   */
  agruparEdges(id){
    let {network} = this.state;
    let edges = [...this.state.graph.edges];
    let edge = {};
    let count = 0;

    /**
     * Itera o array de arestas para preencher um objeto com os dados da aresta selecionada
     */
    edges.forEach(item => {
      if(item.id === id){
        edge = {...item};
      }
    });

    /**
     * Itera o array de arestas para fazer a contagem de arestas com o mesmo label
     */
    edges.forEach( item => {
      if (item.label === edge.label && item.to === edge.to && item.id !== edge.id){
        count++;
      }
    })

    /**
     * Define os eventos do cluster conforme documentação do Vis http://visjs.org/docs/network/#methodClustering
     */
    let clusterOptionsByData = {
      /**Evento para definir as arestas a serem agrupadas */
      joinCondition: (nodeOptions) =>{
        let atende = false;
        
        /**
         * Itera o array de arestas para informar as arestas que serão agrupadas
         * Quando encontra a aresta, retorna verdadeiro para o evento
         */
        edges.forEach(item2 => {
          if(item2.from === nodeOptions.id && item2.label === edge.label){
            atende = true;
          }
        })

        return atende;
      },
      /** 
       * Define algumas propriedades do Agrupamento
      */
      processProperties: function(clusterOptions, childNodes) {
        clusterOptions.label = "[" + childNodes.length + "]";
        
        return clusterOptions;
      },
      clusterNodeProperties: {borderWidth:3, shape:'dot', mass:1, font:{size: 30}, size:(edges.length * (count/10)) + 15},
      clusterEdgeProperties: {label:edge.label}
    };

    network.cluster(clusterOptionsByData);
    network.redraw();

  }

  /** 
   * Método para salvar os dados de uma aresta
  */
  salvarEdge(e){
    /** 
     * impede o formulário de completar a requisição
    */
    e.preventDefault();

    /**
     * Trata os dados do formulário
     */
    const values = this.getFormValues(e.target);

    let edges = [...this.state.graph.edges];
    let nodes = [...this.state.graph.nodes];

    /**
     * Itera o array de arestas para encontrar o nó a ser alterado e atualiza seus dados com os dados do formulário
     */
    edges = edges.map(item => {
      let item_retorno = {...item};
        if(item_retorno.id === values.id){
          item_retorno.label = values.label;
          item_retorno.font.align = values.align;
        } 

        item_retorno.from = item.from;
        item_retorno.to = item.to;

        return item_retorno;
    })

    /** 
     * Atualiza o estado
    */   
    this.setState({
      graph:{
        edges, nodes
      }
    })
    e.target.reset();
    this.toggleEdge();

  }
  /**
   * Método para salvar os dados do nó
   */
  salvar (e) {
    /**
     * Impede o formulário de completar a requisição
     */
    e.preventDefault();
    /**
     * Trata os valores do formulário
     */
    const values = this.getFormValues(e.target);
    const {label, color, point_to, pointed_by} = values;
    /**
     * Caso seja uma alteração, cria uma variavel com o identificador enviado pelo formulário
     * Caso seja uma inserção, cria uma variável com o menor valor disponível para usar como identificador
     */
    const id    = values.id ? parseInt(values.id, 10) : this.getMaxId();

    let nodes = [...this.state.graph.nodes];
    const edges = this.getNewEdges(id,point_to, pointed_by); 
    
    /**
     * Verifica se é uma alteração, caso positivo, itera o array de nós do grafo para encontrar o nó que está sendo editado
     * e alterar os valores pelos valores vindos do formulário
     * Caso contrário adicionar um novo nó no array de nós
     */
    if(values.id){
      nodes = nodes.map(item => {
        let item_retorno = {...item};
          if(item_retorno.id === parseInt(values.id, 10)){
            item_retorno.label = label;
            item_retorno.color = color;
          } 
          return item_retorno;
      })
    }else{
      nodes.push({id,label,color});
    }
    
    /**
     * Atualiza o estado da aplicação
     */
    this.setState({
      graph:{
        nodes, edges
      }
    })
    e.target.reset();
    this.toggle();
  }

  /**
   * Evento do component do react chamado nom momento que é renderizado
   * Atualiza o estado com os dados de estilo que é usado no menu de contexto
   */
  componentDidMount(){
    let menuStyle = document.getElementById("menu").style;    

    this.setState({
      menu:menuStyle
    })
  }

  /**
   * Método para alterar a visibilidade do modal
   */
  toggle(){
    this.setState({
      modal: !this.state.modal
    });
  }
  /**
   * Método para alterar a visibilidade do modal de arestas
   */
  toggleEdge(){
    this.setState({
      modalEdge: !this.state.modalEdge
    });
  }

  /**
   * Método para pegar o nome a ser exibido no label, através do texto retornado pelo servidor
   */
  pegarNodeNome(text){
    let texto = text.substr(text.lastIndexOf('/') + 1);
    texto = texto.substr(texto.lastIndexOf('#') + 1);
    return texto;
  }


 getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /** 
   * Método que retorna o nó, caso ele exista em uma lista, a partir de um nome
  */
  buscarNode(nodes, nome){
    return nodes.find((item)=>{
      return item.label === nome;
    })
  }

  /**
   * Método que irá transformar os dados retornados em um grafo
   * Recebe como paramaetro os dados que vieram do servidor e o label do nó principal
   */
  criarObjetos(data, inicial){
    let nomePredicado = '';
    let nomeObjeto    = '';
    let nomeSujeito   = '';
    let predicado     = {};
    let sujeito       = {};
    let maxId         = this.getMaxId();
    let nodes         = [...this.state.graph.nodes];
    let edges         = [...this.state.graph.edges];
    let options        = {...this.state.options};
    let bindings      = data.results.bindings;
    let cor           = this.getRandomColor();
    let value         = '';
    let {network}     = this.state;
    let objetos       = [];
    let objetosCluster= [];


    /** 
     * atribui o valor a ser exibido no nó principal a uma variavel
     */
    nomeSujeito = this.pegarNodeNome(inicial).substr(0,40);

    /** 
     * Criar um grupo com o nome do nó principal no grafo conforme: http://visjs.org/docs/network/groups.html
    */
    options.groups[nomeSujeito] = {color:{background:cor}, borderWidth:3};
    
    /**
     * Faz a busca do nó principal no array de nós
     */
    sujeito = this.buscarNode(nodes, nomeSujeito);

    /**
     * Caso não exista o nó do sujeito no grafo, ele é criado e adicionado no array de nós
     * Caso contrário, apenas informa que o sujeito agora pertence ao grupo anteriormente criado
     */
    if(!sujeito){
      sujeito =  {id:maxId, label:nomeSujeito,  value:inicial, group:nomeSujeito, mass:3};
      nodes.push(sujeito);
      maxId = maxId + 1;
    }else{
      nodes.map(item =>{
        if(item.id === sujeito.id){
          item.group = nomeSujeito;
        }
        return item;
      })
    }
    
    /** 
     * Itera sobreo array de resultados trazido do servidor
    */
    bindings.forEach(item => {
      /**
       * Para cada item da iteração, é separado em variáveis diferente o nome do predicado e do objeto
       */
      nomePredicado = this.pegarNodeNome(item.value.value.toString()).substr(0,40);
      nomeObjeto    = this.pegarNodeNome(item.property.value.toString());

      /**
       * Adiciona o objeto a lista de objetos
       */
      objetos.push(nomeObjeto);

      /** 
       * Verifica se existe algum nó com o nome do predicado no array de nós
      */
      predicado = this.buscarNode(nodes, nomePredicado);

      /**
       * Caso não exista, é criado um novo objeto com os dados do predicado e adicionado a lista de nós do grafo
       */
      if(!predicado){
        /**
         * Caso o predicado possa ser clicado, ou seja, possui o seu próprio repositório, o endereço do repositório é armazenado no atributo valor
         * para posteriormente ser buscado do servidor ao ser clicado
         */
        value = item.value.type === 'uri' ? item.value.value : 'http://dbpedia.org/resource/' + item.value.value;
        predicado = {id:maxId, label:nomePredicado,value: value, group:nomeSujeito, mass:3} ;
        nodes.push(predicado);
        maxId = maxId + 1;
      }

      /** Adiciona o novo objeto na lista de arestas */
      edges.push({
        from: predicado.id, to:sujeito.id, label:nomeObjeto, font:{align: 'middle'}
      })

    });

    /**
     * Iteração na lista de objetos/arestas, para montar o agrupamento, caso haja mais de uma aresta com o mesmo label
     */
    objetos.forEach(item => {
      let count = 0;
      objetos.forEach(item2 => {
        if(item === item2){
          count++;
        }
      })

      if(count >= 2){
        objetosCluster[item] = count;
      }

    }) 
    
    /**
     * Atualiza o estado da aplicação com os nós e arestas trazidas do servidor e tratadas
     * Foi criada uma função de callback para ser executada após a atualização do estado. que é a função padrão para criação dos agrupamentos
     * Como visto a partir da linha 573 e de acordo com a documentação do VIS: http://visjs.org/docs/network/#methodClustering
     */
    this.setState({
      graph:{
        nodes, edges
      },
      options 
    }, () => {
      for(let elem in objetosCluster){
        let clusterOptionsByData = {
          joinCondition: (nodeOptions) =>{
            let atende = false;
            
            edges.forEach(item2 => {
              if(item2.from === nodeOptions.id && item2.label === elem){
                atende = true;
              }
            })

            return atende;
          },
          processProperties: function(clusterOptions, childNodes) {
            clusterOptions.label = "[" + childNodes.length + "]";
            return clusterOptions;
          },
          clusterNodeProperties: {borderWidth:3, shape:'dot', mass:1, font:{size: 30}, size:(edges.length * (objetosCluster[elem]/10)) + 15}
        };
        network.cluster(clusterOptionsByData);
        network.redraw();
      }
      
    })
  }

  /**
   * Tratamento dos PREFIXES para serem utilizados na query de busca
   */
  toPrefixes(namespaces) {
    var result = '';
    for (var uri in namespaces) {
        result += 'PREFIX ' + namespaces[uri] + ': <' + uri + '>\n';
    }
    return result;
  } 

  /**
   * Método chamado ao clicar  no botão para pesquisar
   * Trata os valores do formulários e invoca o método getNodes para buscar os dados no servidor
   */
  carregar(e){
    e.preventDefault()
    let values = this.getFormValues(e.target);
    this.getNodes('http://dbpedia.org/resource/' + values.sujeito, values.sujeito);
    
  }

  /**
   * Método que busca os dados no servidor
   * recebe como parametro o endereço do repositório e o nome do nó principal
   */
  getNodes(resource, sujeito){

    let app = this;
    /**Invoca o método GET da biblioteca Axios para fazer uma requisição ao servidor da dbpedia */
    axios.get('http://dbpedia.org/sparql', {
      params: {
        'default-graph-uri': 'http://dbpedia.org',
        query: this.toPrefixes(namespaces) + query.replace('[+++RESOURCE+++]', resource),
        format: 'application/sparql-results+json'
      }
    })
    /** 
     * Como o método GET do axios é uma promise, ao retornar os dados, ele executa o método THEN, que invoca o método criarObjetos da aplicação
    */
    .then(function (response) {
      app.criarObjetos(response.data, sujeito)
    })
    .catch(function (error) {
      console.log(error);
    });

  }
  /**
   * Método para renderizar a parte visual da aplicação
   */
  render() {
    return (
      <div>
      {
        /**
         * FormModal e Modal Edge são os componentes invocados para exibição dos formulários de nós e arestas
         */
      }
      <FormModal toggle={this.toggle} modal={this.state.modal} nodes={this.state.graph.nodes} salvar={this.salvar} editingNode={this.state.editingNode}/>
      <ModalEdge toggle={this.toggleEdge} modal={this.state.modalEdge} nodes={this.state.graph.nodes} salvar={this.salvarEdge} editingEdge={this.state.editingEdge}/>
        <h1>LODbrowser, using Dbpedia's Resources</h1>
        {
          /**
           * Componente Menu é exibido quando há o clique com o botão direito
           */
        }
        <Menu itens={this.state.itensMenu} ></Menu>
        {
          /**
           * Componente Formulário é o componente que possui o campo para preenchimento do que se deseja pesquisar e o botão para executar a pesquisa
           * e invocar o método de carregar
           */
        }
        <Formulario carregar={this.carregar} resetar={this.resetar}/>
        {
          /**
           * Componente Graph é o componente da biblioteca 'react-graph-vis', recebe os dados de nós e arestas do objeto de estados do componente
           * dessa forma ao se atualizar o estado, o grafo é atualizado automáticamente
           */
        }
        <Graph graph={this.state.graph} options={this.state.options} events={this.getEvents()} style={{ height: "900px" }} getNetwork={this.getNetwork} />
      </div>
    );
  }
}

export default App;