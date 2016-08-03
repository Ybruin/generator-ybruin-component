fis.config.set('projectConf',{
    name: '<%= componentName %>',
    version:'<%= componentVersion %>',
    domainList:['http://res.cont.yy.com'],
    compDomain:'http://res.cont1.yy.com',
    outputPath:'../../../dist',
    compressCss:false,
    compressImg:false,
    compressJs:false,
    useSprite:true,
    useHash:true
})

fis.config.set('projectConf.useSprite',{
    to:'/images/sprites',
    margin:2
})

fis.runComponentConf();