import string
import random
import tempfile

from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from flask_restful import reqparse
from flask_restful import inputs

from kale.core import Kale

app = Flask(__name__)
api = Api(app)


class deploy(Resource):

    def random_string(self, string_length=10):
        """Generate a random string of fixed length """
        letters = string.ascii_lowercase
        return ''.join(random.choice(letters) for _ in range(string_length))

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('nb', type=str, help='Stringified JSON Notebook')
        parser.add_argument('deploy', type=inputs.boolean, help='True to deploy the pipeline to a running KFP instance')
        parser.add_argument('kfp_port', type=int, default=1234,
                            help='Local port map to remote KFP instance. KFP assumed to be at localhost:<port>/pipeline')
        parser.add_argument('pipeline_name', required=True, type=str, help='Name of the deployed pipeline')
        parser.add_argument('pipeline_descr', required=True, type=str, help='Description of the deployed pipeline')
        parser.add_argument('docker_image', default='stefanofioravanzo/kale-kfp-examples:0.1', type=str,
                            help='Docker base image used to build the pipeline steps')
        parser.add_argument('volumes', required=False, action='append', type=str, help='Name of PVCs to be mounted on pipeline steps')
        parser.add_argument('jupyter_args', type=str,
                            help='YAML file with Jupyter parameters as defined by Papermill')

        args = parser.parse_args()

        # create a tmp folder
        tmp_dir = tempfile.mkdtemp()
        tmp_notebook_path = f"{tmp_dir}/kale_generated_notebook.ipynb"

        if args['nb'] is None:
            f = request.files['notebook_file']
            f.save(tmp_notebook_path)
        else:
            with open(tmp_notebook_path, 'w+') as f:
                f.write(args['nb'])

        try:
            result = Kale(
                source_notebook_path=tmp_notebook_path,
                pipeline_name=args['pipeline_name'] + "_" + self.random_string(4),
                pipeline_descr=args['pipeline_descr'],
                docker_image=args['docker_image'],
                auto_deploy=args['deploy'],
                kfp_port=args['kfp_port'],
                pvcs=(args['volumes'] if args['volumes'] != [''] else None)
            ).run()
            if 'run' in result:
                result['status'] = 200
            else:
                result['status'] = 400
            resp = jsonify(result)
        except Exception as e:
            resp_data = {"status": 500, "message": str(e)}
            resp = jsonify(resp_data)

        # need to always have a 200 response ito parse the data message
        resp.status_code = 200
        return resp




api.add_resource(deploy, '/kale')


if __name__ == '__main__':
    app.run()
