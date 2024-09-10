var getScriptPromisify = (src) => {
  return new Promise((resolve) => {
    $.getScript(src, resolve);
  });
};

var parseMetadata = metadata => {
  const { mainStructureMembers: measuresMap } = metadata;
  const measures = [];
  for (const key in measuresMap) {
    const measure = measuresMap[key];
    measures.push({ key, ...measure });
  }
  return { measures, measuresMap };
};

(function () {
  const template = document.createElement('template');
  template.innerHTML = `
    <style>
      #root {
        width: 100%;
        height: 100%;
      }
    </style>
    <div id="root"></div>
  `;
  class Main extends HTMLElement {
    constructor () {
      super();

      this._shadowRoot = this.attachShadow({ mode: 'open' });
      this._shadowRoot.appendChild(template.content.cloneNode(true));

      this._root = this._shadowRoot.getElementById('root');

      this._eChart = null;
    }

    onCustomWidgetResize (width, height) {
      this.render();
    }

    onCustomWidgetAfterUpdate (changedProps) {
      this.render();
    }

    async render () {
      const dataBinding = this.dataBinding;
      if (!dataBinding || dataBinding.state !== 'success') { return; }

      await getScriptPromisify('https://cdn.staticfile.org/echarts/5.0.0/echarts.min.js');

      const { data, metadata } = dataBinding;
      const { measures } = parseMetadata(metadata);

      if (measures.length === 0) return;

      const measureKey = measures[0].key;
      let dato = data.length > 0 ? data[0][measureKey].raw : 0;
      let objacum = 500;
      let value = (dato*100)/objacum;
      // Que el valor se maneje como un porcentaje
      value = parseFloat(value).toFixed(2);  // Redondear a dos decimales

      if (this._eChart) { echarts.dispose(this._eChart); }
      this._eChart = echarts.init(this._root);

      const option = {
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            center: ['50%', '75%'],
            radius: '90%',
            min: 0,
            max: 100,
            splitNumber: 10,
            axisLine: {
              lineStyle: {
                width: 6, // Más delgado
                color: [
                  [0.1, '#7A0033'],
                  [0.7, '#9AB1E3'],
                  [1, '#3BA396']
                ]
              }
            },
            pointer: {
              icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
              length: '12%',
              width: 20,
              offsetCenter: [0, '-45%'],
              itemStyle: {
                color: 'auto'
              }
            },
            axisTick: {
              length: 12,
              lineStyle: {
                color: 'auto',
                width: 2
              }
            },
            splitLine: {
              length: 20,
              lineStyle: {
                color: 'auto',
                width: 5
              }
            },
            // Eliminar las etiquetas del eje
            axisLabel: {
              show: false
            },
            detail: {
              fontSize: 20,
              offsetCenter: [0, '-25%'],
              valueAnimation: true,
              formatter: '{value} %',
              color: 'inherit'
            },
            title: {
              offsetCenter: [0, '-10%'],
              fontSize: 20
            },
            data: [
              {
                value: value,
                name: ''
              }
            ]
          }
        ]
      };

      this._eChart.setOption(option);
    }
  }

  customElements.define('ejemplo-tacometr', Main);
})();
