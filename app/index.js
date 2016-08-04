var generators = require('yeoman-generator'),
    _ = require('yeoman-generator/node_modules/lodash'),
    glob = require('yeoman-generator/node_modules/glob'),
    chalk = require('yeoman-generator/node_modules/chalk'),
    log = console.log,
    fs = require('fs'),
    path = require('path'),
    del = require('del'),
    win32 = process.platform === 'win32';

module.exports = generators.Base.extend({
    constructor: function(){
        generators.Base.apply(this, arguments);
        this.defaultConfig = {
            'componentName': this.appname,
            'componentAuthor': 'yy',
            'componentVersion': '0.1.0'
        }
    },
    prompting: function(){
        var done = this.async(),
            that = this;
        var questions = [
            {
                name: 'componentAssets',
                type: 'list',
                message: '请选择模板:',
                choices: [
                    {
                        name: 'react组件模板',
                        value: 'react-component',
                        checked: true
                    },{
                        name: '组件模板',
                        value: 'component'
                    }
                ],
                filter: function(val){
                    that.componentAssets = val;
                    return val;
                }
            },
            {
                name: 'componentPlatform',
                type: 'list',
                message: '请选择平台:',
                choices: [
                    {
                        name: '移动端',
                        value: 'mobile',
                        checked: true
                    },{
                        name: 'PC端',
                        value: 'pc'
                    }
                ]
            },
            {
                type: 'input',
                name: 'componentName',
                message: '输入组件名称',
                default: that.appname,
                filter: function(val){
                    that.componentName = val;
                    var dirPath = path.resolve(process.cwd(),'./'+that.componentName);
                    fs.readdir(dirPath, function(err, files){
                        if(files){
                            var len = files.length;
                            if(len > 0){
                                var filesArr = JSON.stringify(files);
                                log(chalk.bold.green('该组件已存在以下版本：'+filesArr));
                            }
                        }else{
                            log(chalk.bold.green('该组件还没有版本'));
                        }
                    })
                    return val;
                }
            },
            {
                type: 'input',
                name: 'componentVersion',
                message: '组件版本号',
                default: that.defaultConfig.componentVersion,
                filter: function(val){
                    var dirPath = path.resolve(process.cwd(),'./'+that.componentName);
                    fs.readdir(dirPath, function(err, files){
                        var exit = false;
                        if(files){
                            for(var i in files){
                                if(val == files[i]) exit = true;
                            }
                        }
                        if(exit){
                            log(chalk.bold.green('已存在该版本，退出'));
                            process.exit(1);
                            return val;
                        }
                    })
                    return val;
                }
            },
            {
                type: 'input',
                name: 'componentAuthor',
                message: '组件开发者',
                store: true,
                default: that.defaultConfig.componentAuthor
            }
        ]
        this.prompt(questions, function(answers){
            for(var item in answers){
                answers.hasOwnProperty(item) && (this[item] = answers[item]);
            }
            done();
        }.bind(this));
    },
    writing: function(){
        var that = this;
        that.componentOutput = './dist';
        that.fileDir = that.componentName + '/' + that.componentVersion;
        //拷贝文件
        that.directory(that.componentAssets,that.fileDir);
        that.copy('components.json', that.fileDir+'/components.json');
        that.copy('ybruin-conf.js', that.fileDir+'/ybruin-conf.js');
        that.copy(that.componentPlatform+'.html', that.fileDir+'/'+that.componentName+'.html');
        //模板
        var filepath = path.resolve(__dirname,'./templates/'+that.componentAssets);
        fs.readdir(filepath, function(err,files){
            for(var i in files){
                if(files[i].indexOf('index')>=0){
                    var tail = files[i].split('index')[1];
                    that.fs.copyTpl(
                        that.templatePath(that.componentAssets+'/'+files[i]),
                        that.destinationPath(that.fileDir+'/'+that.componentName+tail),
                        {
                            componentName: that.componentName
                        }
                    );
                }
            }
        })
    },
    end: function(){
        var that = this,
            content = '',
            commonsPath = path.resolve(process.cwd(),'./commons');
        that.dirPath = that.componentName+'/'+that.componentVersion+'/';
        that.winDirPath = that.componentName+'\\'+that.componentVersion+'\\';
        if(commonsPath){
            // fs.mkdir(that.fileDir+'/commons', function(err){
            //     if(err){
            //         return console.error(err);
            //     }
            //     that.directory(commonsPath,that.fileDir+'/commons');
            // })
            if(win32){
                require('child-process').exec('mklink /d '+that.winDirPath+'commons'+' '+commonsPath);
            }else{
                console.log(commonsPath);
                this.spawnCommand('ln', ['-s', commonsPath,that.dirPath+'commons']);
            }
        }
        del([that.dirPath+'.gitignore',
            that.dirPath+'**/.npmignore',
            that.dirPath+'index.js',
            that.dirPath+'index.scss',
            that.dirPath+'index.tpl',
            that.dirPath+'.DS_Store',
            that.dirPath+'commons/.DS_Store'
        ]);
        that.componentFiles = [];
        fs.readdir(that.dirPath, function(err, files){
            if(err){
                console.log(err);
            }else{
                for(var i in files){
                    if(files[i].indexOf(that.componentName) >= 0){
                        if(files[i].indexOf('scss')>=0){
                            files[i] = files[i].split('scss')[0]+'css';
                        }
                        that.componentFiles.push(files[i]);
                    }
                    if(files[i] === 'images'){
                        fs.readdir(that.dirPath+'/images', function(err, files){
                            if(files){
                                for(var j in files){
                                    that.componentFiles.push('images/'+files[j]);
                                }
                            }
                        })
                    }
                }
            }
            setTimeout(function(){
                content = '{\n'+
                        '"name": '+'"'+that.componentName+'",\n'+
                        '"version": '+'"'+that.componentVersion+'",\n'+
                        '"description": '+'"'+that.componentName+' module",\n'+
                        '"main": '+'"'+that.componentName+'.js",\n'+
                        '"files": '+'"['+that.componentFiles+']"\n'
                    +'}\n'
                fs.writeFile(that.dirPath+'components.json',content,function(err){
                    if(err){
                        console.log(err);
                    }
                    log(chalk.bold.green('将文件写入components.json'));
                })
            },500)
        })
    }
})