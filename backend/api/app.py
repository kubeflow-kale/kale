from flask import Flask, request
from flask_restful import Resource, Api
from flask_restful import reqparse

from kale.core import Kale

app = Flask(__name__)
api = Api(app)


class sumNumbers(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('nb', type=int, help='Rate to charge for this resource')
        parser.add_argument('deploy', type=bool, help='True to deploy the pipeline to a running KFP instance')
        parser.add_argument('kfp_port', type=int, default=8080,
                            help='Local port map to remote KFP instance. KFP assumed to be at localhost:<port>/pipeline')
        parser.add_argument('pipeline_name', required=True, type=str, help='Name of the deployed pipeline')
        parser.add_argument('pipeline_descr', required=True, type=str, help='Description of the deployed pipeline')
        parser.add_argument('docker_image', default='stefanofioravanzo/kale-kfp-examples:0.1', type=str,
                            help='Docker base image used to build the pipeline steps')
        parser.add_argument('jupyter_args', type=str,
                            help='YAML file with Jupyter parameters as defined by Papermill')

        args = parser.parse_args()

        f = request.files['notebook_file']
        f.save('./api/build/nb.ipynb')

        Kale(
            source_notebook_path='./api/nb.ipynb',
            pipeline_name=args['pipeline_name'],
            pipeline_descr=args['pipeline_descr'],
            docker_image=args['docker_image'],
            auto_deploy=args['deploy'],
            kfp_port=args['kfp_port']

        )

        return {'data': args['nb']}


api.add_resource(sumNumbers, '/kale')


if __name__ == '__main__':
     app.run()
