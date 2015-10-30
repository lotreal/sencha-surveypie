    // 创建校验码表单
    _createCaptcha: function() {
        var code = contact(
            T('please enter code'),
            '<input id="captcha_code" type="text" name="_captcha" size="6" maxlength="4"/>',
            '<img id="captcha_img" src="/survey/captcha?t=', $time(), '"/>',
            T('change captcha')
        );

        var div = new Element('div', {'id': 'captcha', 'html': code, 'styles': {'display': 'none'}});
        div.inject(this.form, 'bottom');

        $('captcha_img').addEvent('click', this._changeCaptcha.bind(this));
        this._captcha = div;
        return div;
    },
    // 改变校验码
    _changeCaptcha: function() {
        var img = $('captcha_img'), src = img.get('src'), match = src.match(/^([^\?]+)\?t=(\d+)$/);
        var new_src = match[1] + '?t=' + $time();
        img.set('src', new_src);
        $('captcha_code').removeClass('valid').set('value', '');
    },

    // 检查校验码是否正确
    _checkCaptcha: function(submit) {
        if (!this._enable_captcha) return true;

        if (!this._captcha) this._showCaptcha();
        var box = $('captcha_code'), code = box.get('value').trim();
        if (!code) return false;
        if (box.hasClass('valid')) return true;

        var request = new Request({
            'url': '/survey/checkCaptcha',
            'async': false,
            'data': {'code': code},
            'noCache': true,
            'onSuccess': (function(response) {
                var response = JSON.decode(response, true);
                if (response === true) {
                    $('captcha_code').addClass('valid');
                    if (submit) this.submit();
                } else {
                    this._captcha.highlight();
                    this._changeCaptcha();
                }
            }).bind(this)
        });
        request.send();
    },
    _onClickMatrix: function(event, matrix) {
        // 处理每列只能选择一项
        if (!matrix['pre_column_one_response'].toInt()) return;
        var el = this._getPartEl(matrix), target = $(event.target);
        var row_sn = target.get('row'), col_sn = target.get('col');
        var search = el.getElements('input[col="'+ col_sn +'"]:checked');
        for (var i = 0, input; input = search[i]; i++) {
            if (input.get('row') != row_sn) input.set('checked', false);
        }
    },
    // 清空part表单元素
    _resetPartEl: function(part) {
        var el = this._getPartEl(part), type = part['type'];

        // 清空问题的表单
        if (type == 'text') {
            el.getElements('input, textarea').set('value', '');
        } else if (type == 'select') {
            var form_type = part['form_type'];
            if (form_type == 'select') {
                el.getElements('select').set('value', '');
                var input = el.getElement('input[type="text"]');
                if (input) input.hide().set('value', '');
            } else {
                el.getElements('input[type="'+ form_type +'"]:checked').set('checked', false);
                el.getElements('input[type="text"]').set('value', '');
            }
        } else if ('type' == 'matrix') {
            el.getElements('input:checked').set('checked', false);
        }

        // 去掉错误信息
        var error_el = el.getElement('.title .error');
        if (error_el) error_el.empty();
    },

    // 获取答案
    _getResponse: function(part) {
        var part = this.getPart(part);
        if (!part) return false;

        switch (part['type']) {
            case 'text': return this._getTextResponse(part);
            case 'select': return this._getSelectResponse(part);
            case 'matrix': return this._getMatrixResponse(part);
            default: return false;
        }
    },
    // 获取填空题答案
    _getTextResponse: function(text) {
        var el = this._getPartEl(text);
        if (text['form_type'] == 'textarea') {
            return el.getElement('textarea').get('value').trim();
        } else {
            return el.getElement('input').get('value').trim();
        }
    },
    // 获取选择题答案
    _getSelectResponse: function(select) {
        var el = this._getPartEl(select);
        var response = {'choice': [], 'specify': {}};
        if (el.getStyle('display') == 'none') return response;

        if (select['form_type'] == 'select') {
            var choice = el.getElement('select').get('value');
            if (!choice) return response;

            response['choice'].push(choice);

            var option = this.getPart(choice);
            if ( !(option['allow_specify'] > 0) ) return response;

            // allow speicfy内容
            var input = el.getElement('input');
            if (!input) return response;

            var specify = input.get('value').trim();
            if (choice && specify) response['specify'][choice] = specify;

            return response;
        }

        var search = el.getElements('input:checked');
        for (var i = 0, input; input = search[i]; i++) {
            response['choice'].push(input.get('value'));
        }

        var search = el.getElements('input[type="text"]');
        var reg = new RegExp(/^[0-9a-f\-]{36}\[specify\]\[([0-9a-f\-]{36})\]$/);
        for (var i = 0, input; input = search[i]; i++) {
            var value = input.get('value').trim();
            if (!value) continue;

            var match = input.get('name').match(reg);
            if (match) {
                var option_sn = match[1];
                response['specify'][option_sn] = value;
            }
        }

        return response;
    },
    // 获取组合选择题答案
    _getMatrixResponse: function(matrix) {
        var el = this._getPartEl(matrix), response = {};

        var search = el.getElements('input:checked');
        for (var i = 0, option; option = search[i]; i++) {
            var row_sn = option.get('row'), col_sn = option.get('col');
            if (!response.hasOwnProperty(row_sn)) response[row_sn] = [];
            response[row_sn].push(col_sn);
        }
        return response;
    },
    // 检查答案是否合法
    verifyResponse: function(part) {
        var part = this.getPart(part);

        try {
            switch (part['type']) {
                case 'page': return this._verifyPageResponse(part);
                case 'text': return this._verifyTextResponse(part);
                case 'select': return this._verifySelectResponse(part);
                case 'matrix': return this._verifyMatrixResponse(part);
                default: return true;
            }
        } catch (error) {
            if (error['el'] && error['part']) {
                error['el'].getElement('.error').set('text', error['message']);
            } else { throw error; }

            return false;
        }
        return true;
    },
    _verifyPageResponse: function(page) {
        var children = this.getChildPart(page);

        for (var i = 0, part; part = children[i]; i++) {
            var verify = this.verifyResponse(part);
            if (!verify) {
                this.scrollToPart(part);
                return false;
            }
        }

        return true;
    },
    _verifyTextResponse: function(part) {
        var el = this._getPartEl(part), response = this._getResponse(part);
        var error = {'part': part, 'el': el};

        // 如果处于隐藏状态，不检查必填
        var is_require = (el.getStyle('display') == 'none') ? 0 : part['is_require'];
        if (is_require > 0 && !response) throw $extend(error, {'rule': 'is_require', 'message': T('error is require')});

        var least_input = parseInt(part['least_input'], 10), most_input = parseInt(part['most_input'], 10);
        if (least_input && most_input && least_input > most_input) {
            var swap = least_input;
            least_input = most_input;
            most_input = swap;
        }

        var rep_len = response.length;
        if (rep_len) {
            if (least_input && rep_len < least_input) throw $extend(error, {'rule': 'least_input', 'message': sprintf(T('error least input'), least_input)});
            if (most_input && rep_len > most_input) throw $extend(error, {'rule': 'most_input', 'message': sprintf(T('error most input'), most_input)});
        }

        var form_type = part['form_type'], validator = part['validator'];
        if (form_type != 'textarea' && validator && response) {
            switch (validator) {
                case 'number':
                    var re = /^-?\d+(\.\d+)?$/;
                    var message = T('error validator number');
                    break;
                case 'date':
                    var re = /^\d{4}\-\d{1,2}\-\d{1,2}$/;
                    var message = T('error validator date');
                    break;
                case 'email':
                    var re = /^([a-z0-9_\-\.])+\@([a-z0-9_\-\.])+\.([a-z]{2,4})$/i;
                    var message = T('error validator email');
                    break;
                default: var re = null;
            }

            if (re && !response.test(re)) {
                throw $extend(error, {'rule': 'validator', 'message': message});
            }
        }

        el.getElement('.error').empty();
        return true;
    },
    _verifySelectResponse: function(part) {
        var el = this._getPartEl(part), response = this._getResponse(part), choice_length = response['choice'].length;
        var error = {'part': part, 'el': el};

        // 如果处于隐藏状态，不检查必填
        var is_require = (el.getStyle('display') == 'none') ? 0 : part['is_require'];
        if (is_require > 0 && !choice_length) throw $extend(error, {'rule': 'is_require', 'message': T('error is require')});

        var form_type = part['form_type'];
        if (form_type == 'checkbox' && choice_length) {
            var least_choice = parseInt(part['least_choice'], 10), most_choice = parseInt(part['most_choice'], 10);
            if (least_choice && most_choice && least_choice > most_choice) {
                var swap = least_choice;
                least_choice = most_choice;
                most_choice = swap;
            }

            if (least_choice && choice_length < least_choice) throw $extend(error, {'rule': 'least_choice', 'message': sprintf(T('error least choice'), least_choice)});
            if (most_choice && choice_length > most_choice) throw $extend(error, {'rule': 'most_choice', 'message': sprintf(T('error most choice'), most_choice)});
        }

        for (var i = 0, option_sn; option_sn = response['choice'][i]; i++) {
            var option = this.getPart(option_sn);
            if ( !(option['allow_specify'] > 0) ) continue;

            if (!response['specify'].hasOwnProperty(option_sn)) {
                throw $extend(error, {'rule': 'allow_specify', 'message': T('error option specify')});
            }
            var least_input = parseInt(option['least_input'], 10), most_input = parseInt(option['most_input'], 10), specify = response['specify'][option_sn];
            if (least_input && most_input && least_input > most_input) {
                var swap = least_input;
                least_input = most_input;
                most_input = swap;
            }
            if (least_input && specify.length < least_input) throw $extend(error, {'rule': 'least input', 'message': sprintf('%s'+T('error least input'), this.getLabel(option), least_input)});
            if (most_input && specify.length > most_input) throw $extend(error, {'rule': 'most input', 'message': sprintf('%s'+T('error most input'), this.getLabel(option), most_input)});
        }

        el.getElement('.error').empty();
        return true;
    },
    _verifyMatrixResponse: function(part) {
        var el = this._getPartEl(part), response = this._getResponse(part);
        var error = {'part': part, 'el': el};

        // 如果处于隐藏状态，不检查必填
        var is_require = (el.getStyle('display') == 'none') ? 0 : part['is_require'];

        if (is_require > 0) {
            var options = this.getChildPart(part);
            if (part['pre_column_one_response'] > 0) {
                // 每列只能选一项的情况下，只要每列都选了，就认为完成
                var col_option_count = 0, row_option_count = 0;
                for (var i = 0, option; option = options[i]; i++) {
                    option = this.getPart(option);
                    var direction = option['direction'];
                    if (direction == 'col') col_option_count++;
                    if (direction == 'row') row_option_count++;
                }
                // 如果列大于行或者行大于列，以最少的那个为准
                var option_count = Math.min(col_option_count, row_option_count);

                var response_count = 0;
                for (var sn in response) {
                    response_count++;
                }

                if (response_count < option_count) {
                    throw $extend(error, {'rule': 'is_require', 'message': T('error is require')});
                }
            } else {
                for (var i = 0, option; option = options[i]; i++) {
                    var option = this.getPart(option);
                    if (option['direction'] == 'row' && !response.hasOwnProperty(option['sn'])) {
                        throw $extend(error, {'rule': 'is_require', 'message': T('error is require'), 'row_option': option});
                    }
                }
            }
        }

        el.getElement('.error').empty();
        return true;
    }
